import React, { useState } from "react";
import { useLocation } from "wouter";
import { createGiftCheckoutSession } from "../lib/api";

const giftOptions = [
  {
    duration: "3 Months",
    price: "$24.99",
    priceNote: "one-time payment",
    perMonth: "$8.33/month",
    tier: "Tribune",
    giftTier: "gift_3",
    description: "A great introduction to verified intelligence.",
  },
  {
    duration: "6 Months",
    price: "$44.99",
    priceNote: "one-time payment",
    perMonth: "$7.50/month",
    tier: "Tribune",
    giftTier: "gift_6",
    description: "Half a year of full verification power.",
    popular: true,
  },
  {
    duration: "12 Months",
    price: "$79.99",
    priceNote: "one-time payment",
    perMonth: "$6.67/month",
    tier: "Tribune",
    giftTier: "gift_12",
    description: "A full year of premium access. Best value.",
  },
];

const howItWorks = [
  {
    step: 1,
    title: "Choose which subscription you'd like to give",
    description: "Select the duration that fits your budget. All gift subscriptions include Tribune-tier access.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    step: 2,
    title: "Complete your purchase",
    description: "After purchase, you'll receive a unique gift code and link. Share it however you like -- text, email, or even a handwritten note.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    step: 3,
    title: "Share the gift code or link with your recipient",
    description: "You'll get a unique code and shareable link. Send it via text, email, social media, or even a handwritten note.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
  },
  {
    step: 4,
    title: "The recipient will redeem their subscription and activate their account",
    description: "They can start verifying claims, evaluating sources, and building informed opinions immediately.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
  },
];

const faqItems = [
  {
    question: "Is Confirmd a good gift for someone who is a crypto investor?",
    answer: "Absolutely. Confirmd provides verified intelligence that helps investors separate signal from noise. Whether they're a day trader or long-term holder, evidence-based claim verification is invaluable.",
  },
  {
    question: "Can I pay for my gift subscription?",
    answer: "Yes, all gift subscriptions are one-time payments. We accept all major credit and debit cards through Stripe.",
  },
  {
    question: "How do I send the gift to my recipient?",
    answer: "After purchase, you'll receive a unique gift code and a shareable redemption link. You can share it however you like -- via text message, email, social media, or even write it in a card.",
  },
  {
    question: "Will I be charged after the year gift subscription is up?",
    answer: "No. Gift subscriptions are one-time payments that do not auto-renew. After the gift period ends, the recipient can choose to subscribe on their own.",
  },
  {
    question: "When and how will the recipient receive their gift subscription?",
    answer: "Immediately after your purchase, you'll see a gift code and shareable link on the confirmation page. Share the code or link with your recipient whenever you're ready -- it won't expire until redeemed.",
  },
  {
    question: "Can I buy gifts for multiple people?",
    answer: "Yes! You can purchase multiple gift subscriptions during a single checkout session. For groups of 5 or more, consider our group subscription packages for better value.",
  },
];

const GiftPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaqs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-content-primary tracking-tight leading-tight mb-4">
            Give the gift of perspective
          </h1>
          <p className="text-content-secondary text-lg max-w-2xl mx-auto">
            A perfect gift for a smart, curious person in your life who's always interested
            in seeing the other side of the story and staying well informed.
          </p>
        </div>
      </section>

      {/* Checkout Error */}
      {checkoutError && (
        <section className="max-w-5xl mx-auto px-6 md:px-12 pb-4">
          <div className="bg-red-900/30 border border-red-700 rounded-lg px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-red-300">{checkoutError}</span>
            </div>
            <button onClick={() => setCheckoutError(null)} className="text-red-500 hover:text-red-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="bg-surface-secondary py-12">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-surface-card border border-border flex items-center justify-center mx-auto mb-3 text-content-muted">
                  {item.icon}
                </div>
                <h3 className="text-sm font-bold text-content-primary mb-1">{item.title}</h3>
                <p className="text-xs text-content-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gift Cards */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {giftOptions.map((opt) => (
              <div
                key={opt.duration}
                className={`rounded-xl border bg-surface-card overflow-hidden flex flex-col transition-all hover:bg-surface-card-hover ${
                  opt.popular ? "border-accent ring-2 ring-accent" : "border-border"
                }`}
              >
                {opt.popular && (
                  <div className="bg-accent text-accent-text text-xs font-bold text-center py-1.5">
                    Most Popular
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  {/* Tier badge */}
                  <span className="text-xs font-semibold text-accent mb-3">{opt.tier}</span>

                  {/* Duration */}
                  <h3 className="text-xl font-bold text-content-primary mb-1">{opt.duration}</h3>
                  <p className="text-content-muted text-xs mb-4">{opt.description}</p>

                  {/* Price */}
                  <div className="mb-1">
                    <span className="text-3xl font-bold text-content-primary">{opt.price}</span>
                  </div>
                  <p className="text-xs text-content-muted mb-1">{opt.priceNote}</p>
                  <p className="text-xs text-accent font-semibold mb-6">{opt.perMonth}</p>

                  {/* CTA */}
                  <button
                    onClick={async () => {
                      setCheckoutError(null);
                      setLoadingTier(opt.giftTier);
                      try {
                        const { url } = await createGiftCheckoutSession(opt.giftTier);
                        if (url) window.location.href = url;
                      } catch (err: any) {
                        setCheckoutError("Unable to start checkout. Please try again.");
                        setLoadingTier(null);
                      }
                    }}
                    disabled={loadingTier === opt.giftTier}
                    className={`w-full py-3 rounded-lg text-sm font-bold transition-all mt-auto disabled:opacity-60 disabled:cursor-wait ${
                      opt.popular
                        ? "bg-accent text-accent-text hover:bg-accent-hover"
                        : "border border-border text-content-primary hover:bg-surface-secondary"
                    }`}
                  >
                    {loadingTier === opt.giftTier ? (
                      <span className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Redirecting...</span>
                      </span>
                    ) : (
                      "Gift This Plan"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface-secondary py-16">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <h2 className="text-2xl md:text-3xl font-bold text-content-primary text-center mb-10">
            FAQ
          </h2>
          <div className="space-y-2">
            {faqItems.map((faq, idx) => {
              const isOpen = openFaqs[idx] ?? false;
              return (
                <div key={idx} className="border border-border rounded-lg bg-surface-card overflow-hidden">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-card-hover transition-colors"
                  >
                    <span className="text-sm font-semibold text-content-primary pr-4">{faq.question}</span>
                    <svg
                      className={`w-5 h-5 text-content-muted flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="px-5 pb-5 text-sm text-content-secondary leading-relaxed border-t border-border pt-4">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-content-primary mb-4">
                You'll never look at the news the same way again.
              </h2>
              <p className="text-content-secondary text-sm mb-2">
                We're on a mission to fix a deeply broken news landscape.
                Confirmd strips away spin, separates fact from speculation,
                and arms you with verified intelligence.
              </p>
              <p className="text-content-secondary text-sm">
                Our mission is to empower the relationship between you and
                the information you consume. Join our community of 50,000+
                researchers and analysts who use Confirmd to make better
                decisions every day.
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="bg-surface-card border border-border rounded-xl w-64 h-48 flex items-center justify-center">
                <span className="text-content-muted text-sm italic">Gift illustration</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GiftPage;
