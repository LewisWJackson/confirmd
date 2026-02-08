import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { createCheckoutSession } from "../lib/api";

interface PlusFaqItem {
  question: string;
  answer: string;
}

const plusFaqs: PlusFaqItem[] = [
  {
    question: "Does Confirmd have a political agenda?",
    answer:
      "No. Confirmd is an independent verification platform. We use transparent, algorithmic methodology to assess claims. Our team spans a range of perspectives, and our scoring is based purely on evidence quality and source track records.",
  },
  {
    question: "Can I switch between tiers?",
    answer:
      "Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately and you will be charged a prorated amount. Downgrades take effect at the end of your current billing period.",
  },
  {
    question: "Is there a free trial for Tribune or Oracle?",
    answer:
      "New users get a 7-day free trial of Tribune when they create an account. No credit card required. Oracle trials are available upon request for institutional users.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards via Stripe, including Visa, Mastercard, and American Express. Cryptocurrency payments are coming soon.",
  },
  {
    question: "What happens if I cancel?",
    answer:
      "You retain access to your paid features through the end of your billing period. After that, your account reverts to the Scholar (free) tier. Your watchlist and data are preserved.",
  },
  {
    question: "Do you offer team or enterprise plans?",
    answer:
      "Yes. For teams of 5 or more, we offer custom pricing with shared dashboards, team watchlists, and dedicated support. Email hello@confirmd.io for details.",
  },
  {
    question: "How does Confirmd provide a bias-free rating on news stories?",
    answer:
      "Our scoring relies on quantitative methodology: Bayesian shrinkage on historical claim accuracy, evidence ladder quality assessment, and multi-source cross-referencing. No editorial judgment enters the rating pipeline.",
  },
];

const tiers = [
  {
    name: "Scholar",
    price: "Free",
    priceNote: "forever",
    description: "The essentials for staying informed.",
    ctaText: "Get Started",
    recommended: false,
    image: "scholar",
    features: [
      { text: "Main news feed", included: true },
      { text: "Basic verdict labels", included: true },
      { text: "3 watchlist items", included: true },
      { text: "2 evidence previews per claim", included: true },
      { text: "7-day claim history", included: true },
      { text: "Full evidence ladders", included: false },
      { text: "Real-time alerts", included: false },
      { text: "API access", included: false },
      { text: "Data export", included: false },
    ],
  },
  {
    name: "Tribune",
    price: "$9.99",
    priceNote: "/month",
    description: "Full verification power for serious researchers.",
    ctaText: "Start Free Trial",
    recommended: true,
    image: "tribune",
    features: [
      { text: "Everything in Scholar", included: true },
      { text: "Full evidence ladders", included: true },
      { text: "25 watchlist items", included: true },
      { text: "Real-time alerts", included: true },
      { text: "Source credibility history", included: true },
      { text: "90-day claim history", included: true },
      { text: "Priority support", included: true },
      { text: "API access", included: false },
      { text: "Data export", included: false },
    ],
  },
  {
    name: "Oracle",
    price: "$29.99",
    priceNote: "/month",
    description: "Institutional-grade intelligence and data access.",
    ctaText: "Contact Us",
    recommended: false,
    image: "oracle",
    features: [
      { text: "Everything in Tribune", included: true },
      { text: "API access (REST & WebSocket)", included: true },
      { text: "Data export (CSV, JSON)", included: true },
      { text: "100 watchlist items", included: true },
      { text: "Custom alert rules", included: true },
      { text: "Unlimited claim history", included: true },
      { text: "Early access features", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "SLA guarantees", included: true },
    ],
  },
];

const comparisonFeatures = [
  { feature: "News Feed", scholar: true, tribune: true, oracle: true },
  { feature: "Verdict Labels", scholar: true, tribune: true, oracle: true },
  {
    feature: "Evidence Preview",
    scholar: "2 per claim",
    tribune: "Full ladder",
    oracle: "Full ladder",
  },
  {
    feature: "Watchlist Items",
    scholar: "3",
    tribune: "25",
    oracle: "100",
  },
  { feature: "Real-Time Alerts", scholar: false, tribune: true, oracle: true },
  {
    feature: "Source History",
    scholar: false,
    tribune: "90 days",
    oracle: "Unlimited",
  },
  {
    feature: "Claim History",
    scholar: "7 days",
    tribune: "90 days",
    oracle: "Unlimited",
  },
  { feature: "Priority Support", scholar: false, tribune: true, oracle: true },
  { feature: "API Access", scholar: false, tribune: false, oracle: true },
  { feature: "Data Export", scholar: false, tribune: false, oracle: true },
  {
    feature: "Custom Alert Rules",
    scholar: false,
    tribune: false,
    oracle: true,
  },
  {
    feature: "Early Access Features",
    scholar: false,
    tribune: false,
    oracle: true,
  },
];

const PlusPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setShowSuccess(true);
      window.history.replaceState({}, "", "/plus");
    }
  }, []);

  const handleSubscribe = async (tierName: string) => {
    const key = tierName.toLowerCase();
    setCheckoutError(null);
    if (key === "scholar") {
      setLocation("/signup");
      return;
    }
    if (key === "oracle") {
      window.location.href = "mailto:hello@confirmd.io?subject=Oracle%20Tier%20Inquiry";
      return;
    }
    setLoadingTier(key);
    try {
      const { url } = await createCheckoutSession(key);
      if (url) window.location.href = url;
    } catch (err) {
      console.error("Checkout error:", err);
      setCheckoutError("Unable to start checkout. Please sign in first or try again.");
      setLoadingTier(null);
    }
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="relative z-10 bg-surface-primary min-h-screen">
      {/* Success Banner */}
      {showSuccess && (
        <div className="max-w-5xl mx-auto px-6 md:px-12 pt-6">
          <div className="bg-green-900/30 border border-green-700 rounded-lg px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-semibold text-green-300">
                Subscription activated! Welcome to Confirmd Plus.
              </span>
            </div>
            <button onClick={() => setShowSuccess(false)} className="text-green-500 hover:text-green-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="pt-16 pb-12 text-center">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h1 className="text-4xl md:text-5xl font-bold text-content-primary tracking-tight mb-4">
            Subscription Options
          </h1>
          <p className="text-content-secondary text-lg max-w-2xl mx-auto">
            Choose the plan that fits your verification needs. Upgrade or downgrade at any time.
          </p>
        </div>
      </section>

      {/* Checkout Error */}
      {checkoutError && (
        <section className="max-w-5xl mx-auto px-6 md:px-12 pb-6">
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

      {/* Pricing Cards */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl border border-border bg-surface-card overflow-hidden flex flex-col transition-all hover:bg-surface-card-hover ${
                tier.recommended ? "ring-2 ring-accent" : ""
              }`}
            >
              {/* Tier Badge */}
              <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                  tier.recommended
                    ? "bg-accent text-accent-text"
                    : "bg-surface-secondary text-content-secondary"
                }`}>
                  {tier.name}
                </span>
                {tier.recommended && (
                  <span className="text-xs font-semibold text-accent">Recommended</span>
                )}
              </div>

              {/* Image placeholder */}
              <div className="px-6 py-4">
                <div className="w-full h-40 bg-surface-secondary rounded-lg flex items-center justify-center">
                  <span className="text-content-muted text-sm italic">
                    {tier.image === "scholar" && "See the full picture."}
                    {tier.image === "tribune" && "Rise above the noise."}
                    {tier.image === "oracle" && "Get clarity."}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="px-6 pb-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-content-primary">{tier.price}</span>
                  <span className="text-content-muted text-sm ml-1">{tier.priceNote}</span>
                </div>
                <p className="text-content-secondary text-sm mt-2">{tier.description}</p>
              </div>

              {/* Features */}
              <div className="px-6 pb-6 flex-1">
                <ul className="space-y-3">
                  {tier.features.map((f) => (
                    <li key={f.text} className="flex items-start space-x-2">
                      {f.included ? (
                        <svg className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-content-muted flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                        </svg>
                      )}
                      <span className={`text-sm ${f.included ? "text-content-primary" : "text-content-muted"}`}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="px-6 pb-6">
                <button
                  onClick={() => handleSubscribe(tier.name)}
                  disabled={loadingTier === tier.name.toLowerCase()}
                  className={`w-full py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-wait ${
                    tier.recommended
                      ? "bg-accent text-accent-text hover:bg-accent-hover"
                      : "border border-border text-content-primary hover:bg-surface-secondary"
                  }`}
                >
                  {loadingTier === tier.name.toLowerCase() ? (
                    <span className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Redirecting...</span>
                    </span>
                  ) : (
                    tier.ctaText
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Trusted by logos placeholder */}
        <div className="mt-12 text-center">
          <p className="text-content-muted text-xs uppercase tracking-wider mb-4">Trusted by readers of</p>
          <div className="flex items-center justify-center space-x-8 text-content-muted">
            <span className="text-sm font-semibold opacity-50">Forbes</span>
            <span className="text-sm font-semibold opacity-50">CoinDesk</span>
            <span className="text-sm font-semibold opacity-50">The Block</span>
            <span className="text-sm font-semibold opacity-50">Decrypt</span>
            <span className="text-sm font-semibold opacity-50">Messari</span>
          </div>
        </div>
      </section>

      {/* See News Differently / Testimonial */}
      <section className="bg-surface-secondary py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-content-primary mb-12">
            See news differently.
          </h2>

          <div className="relative">
            <svg className="w-12 h-12 text-accent mx-auto mb-8 opacity-40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>

            <blockquote className="text-lg md:text-xl text-content-primary leading-relaxed max-w-3xl mx-auto mb-8">
              Confirmd is an excellent way to stay informed, build truly informed opinions, and expand your understanding.
              The platform strips away noise and gives you evidence-based clarity on the claims that matter most in crypto.
            </blockquote>

            <div className="flex items-center justify-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <span className="text-xs font-bold text-accent-text">KF</span>
              </div>
              <div className="text-left">
                <div className="font-bold text-content-primary text-sm">Karol Fitzgerald</div>
                <div className="text-content-muted text-xs">Executive Director, Digital Asset Research Center</div>
              </div>
            </div>

            <svg className="w-12 h-12 text-accent mx-auto mt-8 opacity-40 rotate-180" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="max-w-5xl mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-content-primary">
            Compare Plans
          </h2>
          <p className="text-content-secondary mt-3">
            A detailed breakdown of what each tier includes.
          </p>
        </div>

        <div className="rounded-xl border border-border overflow-hidden bg-surface-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 md:p-6 text-xs font-bold uppercase tracking-wider text-content-muted">
                    Feature
                  </th>
                  <th className="p-4 md:p-6 text-xs font-bold uppercase tracking-wider text-content-muted text-center">
                    Scholar
                  </th>
                  <th className="p-4 md:p-6 text-xs font-bold uppercase tracking-wider text-accent text-center">
                    Tribune
                  </th>
                  <th className="p-4 md:p-6 text-xs font-bold uppercase tracking-wider text-content-muted text-center">
                    Oracle
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={idx < comparisonFeatures.length - 1 ? "border-b border-border" : ""}
                  >
                    <td className="p-4 md:p-6 text-sm font-semibold text-content-primary">
                      {row.feature}
                    </td>
                    {(["scholar", "tribune", "oracle"] as const).map((t) => {
                      const val = row[t];
                      return (
                        <td key={t} className="p-4 md:p-6 text-center">
                          {val === true ? (
                            <svg className="w-5 h-5 text-accent mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : val === false ? (
                            <svg className="w-5 h-5 text-content-muted mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          ) : (
                            <span className="text-sm font-medium text-content-secondary">{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table CTA buttons */}
          <div className="border-t border-border">
            <div className="grid grid-cols-4">
              <div className="p-4 md:p-6" />
              {tiers.map((tier) => (
                <div key={tier.name} className="p-4 md:p-6 text-center">
                  <button
                    onClick={() => handleSubscribe(tier.name)}
                    disabled={loadingTier === tier.name.toLowerCase()}
                    className={`text-xs font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-60 ${
                      tier.recommended
                        ? "bg-accent text-accent-text hover:bg-accent-hover"
                        : "border border-border text-content-primary hover:bg-surface-secondary"
                    }`}
                  >
                    {tier.ctaText}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Group Subscriptions Callout */}
      <section className="max-w-5xl mx-auto px-6 md:px-12 pb-20">
        <div className="bg-surface-card border border-border rounded-xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-content-primary mb-2">Group Subscriptions</h3>
            <p className="text-content-secondary text-sm max-w-md">
              Save up to 40% with group subscription packages for classrooms, organizations, newsrooms, or institutions. Teams of up to 50 users.
            </p>
          </div>
          <button
            onClick={() => setLocation("/group-subscriptions")}
            className="border border-accent text-accent px-6 py-3 rounded-lg text-sm font-bold hover:bg-accent hover:text-accent-text transition-all whitespace-nowrap"
          >
            Learn More
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface-secondary py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-content-primary text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-2">
            {plusFaqs.map((faq, idx) => {
              const isOpen = openFaqs[idx] ?? false;
              return (
                <div
                  key={idx}
                  className="border border-border rounded-lg bg-surface-card overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-card-hover transition-colors"
                  >
                    <span className="text-sm font-semibold text-content-primary pr-4">
                      {faq.question}
                    </span>
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
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
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

      {/* Gift Subscriptions Callout */}
      <section className="max-w-5xl mx-auto px-6 md:px-12 py-20">
        <div className="bg-surface-card border border-border rounded-xl p-8 md:p-12 text-center">
          <h3 className="text-2xl font-bold text-content-primary mb-2">Gift Subscriptions</h3>
          <p className="text-content-secondary text-sm max-w-lg mx-auto mb-6">
            Give the gift of perspective, naturally. A perfect gift for a curious person in your life who values verified information.
          </p>
          <button
            onClick={() => setLocation("/gift")}
            className="border border-accent text-accent px-6 py-3 rounded-lg text-sm font-bold hover:bg-accent hover:text-accent-text transition-all"
          >
            Gift Subscriptions Now
          </button>
        </div>
      </section>

      {/* Bottom CTA - Supported by subscribers */}
      <section className="bg-surface-secondary py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-content-primary mb-4">
            Confirmd is supported by our subscribers.
          </h2>
          <p className="text-content-secondary max-w-2xl mx-auto mb-8">
            Our mission is to empower people with transparent, evidence-based verification of crypto claims.
            Every subscription helps us remain independent, unbiased, and committed to factual reporting.
          </p>
          <button
            onClick={() => handleSubscribe("Tribune")}
            disabled={loadingTier === "tribune"}
            className="bg-accent text-accent-text px-8 py-4 rounded-lg text-sm font-bold hover:bg-accent-hover transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            {loadingTier === "tribune" ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Redirecting...</span>
              </span>
            ) : (
              "Become a subscriber"
            )}
          </button>
        </div>
      </section>
    </div>
  );
};

export default PlusPage;
