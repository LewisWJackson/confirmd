import React, { useState } from "react";
import { useLocation } from "wouter";

const giftOptions = [
  {
    duration: "3 Months",
    price: "$24.99",
    priceNote: "one-time payment",
    perMonth: "$8.33/month",
    tier: "Tribune",
    description: "A great introduction to verified intelligence.",
  },
  {
    duration: "6 Months",
    price: "$44.99",
    priceNote: "one-time payment",
    perMonth: "$7.50/month",
    tier: "Tribune",
    description: "Half a year of full verification power.",
    popular: true,
  },
  {
    duration: "12 Months",
    price: "$79.99",
    priceNote: "one-time payment",
    perMonth: "$6.67/month",
    tier: "Tribune",
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
    title: "Add a customized gift message (optional)",
    description: "Include a personal note with your gift to let the recipient know why you're sharing Confirmd.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    step: 3,
    title: "We'll send the recipient an email",
    description: "The recipient will receive instructions on how to activate their gift subscription.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
    question: "Can I send the gift subscription directly to my recipient?",
    answer: "Yes. During checkout, you can enter the recipient's email address and we'll send them instructions to activate their subscription.",
  },
  {
    question: "Will I be charged after the year gift subscription is up?",
    answer: "No. Gift subscriptions are one-time payments that do not auto-renew. After the gift period ends, the recipient can choose to subscribe on their own.",
  },
  {
    question: "When and how will the recipient receive their gift subscription?",
    answer: "The recipient will receive an email within minutes of your purchase with activation instructions. You can also choose a future delivery date.",
  },
  {
    question: "Can I buy gifts for multiple people?",
    answer: "Yes! You can purchase multiple gift subscriptions during a single checkout session. For groups of 5 or more, consider our group subscription packages for better value.",
  },
];

const GiftPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});

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
                    onClick={() => setLocation("/plus")}
                    className={`w-full py-3 rounded-lg text-sm font-bold transition-all mt-auto ${
                      opt.popular
                        ? "bg-accent text-accent-text hover:bg-accent-hover"
                        : "border border-border text-content-primary hover:bg-surface-secondary"
                    }`}
                  >
                    Gift This Plan
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Trusted by logos */}
          <div className="mt-12 text-center">
            <p className="text-content-muted text-xs uppercase tracking-wider mb-4">As featured in</p>
            <div className="flex items-center justify-center space-x-8 text-content-muted">
              <span className="text-sm font-semibold opacity-50">Forbes</span>
              <span className="text-sm font-semibold opacity-50">CoinDesk</span>
              <span className="text-sm font-semibold opacity-50">The Block</span>
              <span className="text-sm font-semibold opacity-50">Decrypt</span>
              <span className="text-sm font-semibold opacity-50">Messari</span>
            </div>
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
