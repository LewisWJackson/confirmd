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

const features: { label: string; icon: React.ReactNode }[] = [
  {
    label: "Full creator claims & predictions",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    label: "Creator profile pages & accuracy tracking",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: "Real-time alerts",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    label: "Full evidence ladders",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    label: "Source credibility history",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Priority support",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: "90-day claim history",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "Blindspot reports",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
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
          {/* Hero illustration */}
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-accent/20 rounded-2xl rotate-6" />
            <div className="absolute inset-0 bg-accent/10 rounded-2xl -rotate-3" />
            <div className="relative w-full h-full bg-accent rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-accent-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

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
                <li key={feature.label} className="flex items-start space-x-3">
                  <span className="text-accent flex-shrink-0 mt-0.5">{feature.icon}</span>
                  <span className="text-sm text-content-primary">{feature.label}</span>
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
      <section className="bg-surface-secondary py-20 relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="testimonial-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="currentColor" className="text-accent" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#testimonial-grid)" />
          </svg>
        </div>
        {/* Radial glow behind quote */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-content-primary mb-12">
            See news differently.
          </h2>

          <div className="relative bg-surface-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-12">
            <svg className="w-12 h-12 text-accent mx-auto mb-8 opacity-40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>

            <blockquote className="text-lg md:text-xl text-content-primary leading-relaxed max-w-3xl mx-auto mb-8">
              Confirmd is an excellent way to stay informed, build truly informed opinions, and expand your understanding.
              The platform strips away noise and gives you evidence-based clarity on the claims that matter most in crypto.
            </blockquote>

            <div className="flex items-center justify-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center ring-2 ring-accent/30 ring-offset-2 ring-offset-surface-card">
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
