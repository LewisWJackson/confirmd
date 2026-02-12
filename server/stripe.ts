import { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import crypto from "crypto";
import { storage } from "./storage.js";

const router = Router();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const TIER_PRICES: Record<string, { amount: number; name: string }> = {
  plus: { amount: 999, name: "Confirmd+" },
};

const GIFT_PRICES: Record<string, { amountCents: number; durationMonths: number; name: string }> = {
  gift_3: { amountCents: 2499, durationMonths: 3, name: "Confirmd+ Gift — 3 Months" },
  gift_6: { amountCents: 4499, durationMonths: 6, name: "Confirmd+ Gift — 6 Months" },
  gift_12: { amountCents: 7999, durationMonths: 12, name: "Confirmd+ Gift — 12 Months" },
};

export function generateGiftCode(): string {
  const bytes = crypto.randomBytes(6);
  const hex = bytes.toString("hex").toUpperCase();
  return `GIFT-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

// ─── GET /config ─────────────────────────────────────────────────────

router.get("/config", (_req: Request, res: Response) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});

// ─── POST /create-checkout ───────────────────────────────────────────

router.post("/create-checkout", async (req: Request, res: Response) => {
  if (!stripe) {
    res.status(503).json({ error: "Stripe not configured" });
    return;
  }
  try {
    const { tier } = req.body;

    if (!tier || !TIER_PRICES[tier]) {
      res.status(400).json({ error: "Invalid tier. Must be 'plus'." });
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

// ─── POST /create-gift-checkout ──────────────────────────────────────

router.post("/create-gift-checkout", async (req: Request, res: Response) => {
  if (!stripe) {
    res.status(503).json({ error: "Stripe not configured" });
    return;
  }
  try {
    const { giftTier } = req.body;
    if (!giftTier || !GIFT_PRICES[giftTier]) {
      res.status(400).json({ error: "Invalid gift tier" });
      return;
    }
    const { amountCents, durationMonths, name } = GIFT_PRICES[giftTier];
    const origin = `${req.protocol}://${req.get("host")}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/gift/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/gift`,
      metadata: { type: "gift", giftTier, durationMonths: String(durationMonths) },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("POST /stripe/create-gift-checkout error:", err);
    res.status(500).json({ error: "Failed to create gift checkout session" });
  }
});

// ─── GET /gift/:sessionId ───────────────────────────────────────────

router.get("/gift/:sessionId", async (req: Request, res: Response) => {
  try {
    const gift = await storage.getGiftByStripeSession(req.params.sessionId);
    if (!gift) {
      res.status(404).json({ error: "Gift not found" });
      return;
    }
    res.json({
      code: gift.code,
      durationMonths: gift.durationMonths,
      status: gift.status,
      createdAt: gift.createdAt,
    });
  } catch (err) {
    console.error("GET /stripe/gift/:sessionId error:", err);
    res.status(500).json({ error: "Failed to fetch gift" });
  }
});

// ─── POST /webhook ───────────────────────────────────────────────────

router.post("/webhook", async (req: Request, res: Response) => {
  if (!stripe) {
    res.status(503).json({ error: "Stripe not configured" });
    return;
  }

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
      const customerEmail = session.customer_details?.email;

      if (session.metadata?.type === "gift") {
        // ── Gift purchase flow ──────────────────────────────────────
        const durationMonths = parseInt(session.metadata.durationMonths ?? "0", 10);
        const giftTier = session.metadata.giftTier ?? "";
        const amountCents = GIFT_PRICES[giftTier]?.amountCents ?? 0;
        const code = generateGiftCode();

        console.log(
          `[Stripe] Gift checkout completed — tier: ${giftTier}, email: ${customerEmail}, session: ${session.id}, code: ${code}`,
        );

        await storage.createGift({
          code,
          purchaserEmail: customerEmail ?? "unknown",
          stripeSessionId: session.id,
          durationMonths,
          amountCents,
          status: "pending",
        });

        console.log(`[Stripe] Gift created with code: ${code}, duration: ${durationMonths} months`);
      } else {
        // ── Regular subscription flow ───────────────────────────────
        const tier = session.metadata?.tier;
        console.log(
          `[Stripe] Checkout completed — tier: ${tier}, email: ${customerEmail}, session: ${session.id}`,
        );

        if (customerEmail && tier) {
          const user = await storage.getUserByEmail(customerEmail);
          if (user) {
            await storage.updateUserTier(user.id, tier);
            console.log(`[Stripe] Updated user ${user.id} subscription to "${tier}"`);
          } else {
            console.warn(`[Stripe] No user found for email: ${customerEmail}`);
          }
        }
      }
      break;
    }
    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
