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
    question: "Is there a free trial?",
    answer:
      "Yes. New users get a 7-day free trial when they subscribe. You can cancel anytime during the trial and you won't be charged.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards via Stripe, including Visa, Mastercard, and American Express. Cryptocurrency payments are coming soon.",
  },
  {
    question: "What happens if I cancel?",
    answer:
      "You retain access to all Plus features through the end of your billing period. After that, your account reverts to the free tier. Your watchlist and data are preserved.",
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

const features = [
  "Full creator claims & predictions",
  "Creator profile pages & accuracy tracking",
  "Real-time alerts",
  "Full evidence ladders",
  "Source credibility history",
  "Priority support",
  "90-day claim history",
  "Blindspot reports",
];

const PlusPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setShowSuccess(true);
      window.history.replaceState({}, "", "/plus");
    }
  }, []);

  const handleSubscribe = async () => {
    setCheckoutError(null);
    setLoading(true);
    try {
      const { url } = await createCheckoutSession("plus");
      if (url) window.location.href = url;
    } catch (err) {
      console.error("Checkout error:", err);
      setCheckoutError("Unable to start checkout. Please sign in first or try again.");
      setLoading(false);
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
      <section className="pt-16 pb-4 text-center">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h1 className="text-4xl md:text-5xl font-bold text-content-primary tracking-tight mb-4">
            Confirmd Plus
          </h1>
          <p className="text-content-secondary text-lg max-w-2xl mx-auto">
            Get the full picture. Evidence-based clarity on the claims that matter most.
          </p>
        </div>
      </section>

      {/* Checkout Error */}
      {checkoutError && (
        <section className="max-w-lg mx-auto px-6 md:px-12 pb-4">
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

      {/* Single Pricing Card */}
      <section className="max-w-lg mx-auto px-6 md:px-12 py-12">
        <div className="rounded-xl border border-accent ring-2 ring-accent bg-surface-card overflow-hidden">
          {/* Price */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-border">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-content-primary">$9.99</span>
              <span className="text-content-muted text-lg">/month</span>
            </div>
            <p className="text-content-secondary text-sm mt-3">
              Cancel anytime. 7-day free trial included.
            </p>
          </div>

          {/* Features */}
          <div className="px-8 py-8">
            <p className="text-xs font-bold uppercase tracking-wider text-content-muted mb-5">
              Everything included
            </p>
            <ul className="space-y-4">
              {features.map((feature) => (
                <li key={feature} className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-content-primary">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="px-8 pb-8">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-4 rounded-lg text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-wait bg-accent text-accent-text hover:bg-accent-hover"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Redirecting...</span>
                </span>
              ) : (
                "Start Free Trial"
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Testimonial */}
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

      {/* FAQ */}
      <section className="py-20">
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
      <section className="max-w-5xl mx-auto px-6 md:px-12 pb-20">
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

      {/* Bottom CTA */}
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
            onClick={handleSubscribe}
            disabled={loading}
            className="bg-accent text-accent-text px-8 py-4 rounded-lg text-sm font-bold hover:bg-accent-hover transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            {loading ? (
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
