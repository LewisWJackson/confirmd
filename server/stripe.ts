import { Router, type Request, type Response } from "express";
import Stripe from "stripe";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const TIER_PRICES: Record<string, { amount: number; name: string }> = {
  tribune: { amount: 999, name: "Confirmd Plus — Tribune" },
  oracle: { amount: 2999, name: "Confirmd Plus — Oracle" },
};

// ─── GET /config ─────────────────────────────────────────────────────

router.get("/config", (_req: Request, res: Response) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});

// ─── POST /create-checkout ───────────────────────────────────────────

router.post("/create-checkout", async (req: Request, res: Response) => {
  try {
    const { tier } = req.body;

    if (!tier || !TIER_PRICES[tier]) {
      res.status(400).json({ error: "Invalid tier. Must be 'tribune' or 'oracle'." });
      return;
    }

    const { amount, name } = TIER_PRICES[tier];
    const origin = `${req.protocol}://${req.get("host")}`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name },
            unit_amount: amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/plus?success=true`,
      cancel_url: `${origin}/plus`,
      metadata: { tier },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("POST /stripe/create-checkout error:", err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// ─── POST /webhook ───────────────────────────────────────────────────

router.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;

  if (!sig) {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", (err as Error).message);
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const tier = session.metadata?.tier;
      const customerEmail = session.customer_details?.email;
      console.log(
        `[Stripe] Checkout completed — tier: ${tier}, email: ${customerEmail}, session: ${session.id}`,
      );
      // TODO: Update user subscription tier in database once auth is wired
      break;
    }
    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
