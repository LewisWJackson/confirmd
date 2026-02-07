import React, { useState } from "react";

interface PlusFaqItem {
  question: string;
  answer: string;
}

const plusFaqs: PlusFaqItem[] = [
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
];

const tiers = [
  {
    name: "Scholar",
    price: "Free",
    priceNote: "forever",
    description: "The essentials for staying informed.",
    color: "slate",
    borderClass: "border-slate-200",
    bgClass: "bg-white",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    ctaClass:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200",
    ctaText: "Get Started",
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
    color: "cyan",
    borderClass: "border-cyan-200",
    bgClass: "bg-white",
    badgeClass: "bg-cyan-50 text-cyan-600 border-cyan-200",
    ctaClass:
      "bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-500/25",
    ctaText: "Start Free Trial",
    popular: true,
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
    color: "slate",
    borderClass: "border-slate-300",
    bgClass: "bg-slate-900 text-white",
    badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
    ctaClass:
      "bg-white text-slate-900 hover:bg-slate-100 shadow-lg font-black",
    ctaText: "Contact Us",
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
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});

  const toggleFaq = (idx: number) => {
    setOpenFaqs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="relative z-10 animate-in">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-block px-5 py-2 bg-cyan-50 border border-cyan-100 rounded-full mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600">
              Confirmd Plus
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9] mb-8">
            Unlock the<br />
            <span className="text-cyan-600">Full Signal</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
            Go beyond headlines. Get full evidence ladders, real-time alerts,
            and the verified intelligence that serious crypto participants
            demand.
          </p>
        </div>
      </section>

      {/* Testimonial */}
      <section className="max-w-4xl mx-auto px-6 md:px-12 pb-20">
        <div className="glass rounded-[2.5rem] p-10 md:p-14 border border-slate-100 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/5 blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <svg
              className="w-10 h-10 text-cyan-200 mb-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <blockquote className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed mb-8">
              After using Confirmd for the first time, I realized I can't
              make another YouTube video without using Confirmd as my
              resource for verification
            </blockquote>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center">
                <span className="text-sm font-black text-white">LJ</span>
              </div>
              <div>
                <div className="font-black text-slate-900">
                  Louis Jackson
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Content Creator & Researcher
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-[2.5rem] p-10 border ${tier.borderClass} ${tier.bgClass} relative overflow-hidden transition-all hover:shadow-2xl ${
                tier.popular ? "md:-mt-4 md:mb-4 shadow-xl" : ""
              }`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute top-8 right-8">
                  <div className="bg-cyan-500 text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Tier Badge */}
              <div
                className={`inline-block px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border mb-6 ${tier.badgeClass}`}
              >
                {tier.name}
              </div>

              {/* Price */}
              <div className="mb-4">
                <span
                  className={`text-5xl font-black tracking-tighter ${
                    tier.name === "Oracle" ? "text-white" : "text-slate-900"
                  }`}
                >
                  {tier.price}
                </span>
                <span
                  className={`text-sm font-bold ml-1 ${
                    tier.name === "Oracle"
                      ? "text-slate-400"
                      : "text-slate-400"
                  }`}
                >
                  {tier.priceNote}
                </span>
              </div>

              <p
                className={`text-sm font-medium mb-8 ${
                  tier.name === "Oracle"
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                {tier.description}
              </p>

              {/* CTA */}
              <a
                href="#"
                className={`block w-full text-center text-[11px] font-black px-8 py-4 rounded-xl transition-all uppercase tracking-[0.15em] mb-10 ${tier.ctaClass}`}
              >
                {tier.ctaText}
              </a>

              {/* Features */}
              <div className="space-y-4">
                {tier.features.map((f) => (
                  <div key={f.text} className="flex items-start space-x-3">
                    {f.included ? (
                      <div className="w-5 h-5 rounded-md bg-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={4}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          tier.name === "Oracle"
                            ? "bg-slate-700"
                            : "bg-slate-100"
                        }`}
                      >
                        <svg
                          className={`w-3 h-3 ${
                            tier.name === "Oracle"
                              ? "text-slate-500"
                              : "text-slate-300"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M18 12H6"
                          />
                        </svg>
                      </div>
                    )}
                    <span
                      className={`text-sm font-medium ${
                        f.included
                          ? tier.name === "Oracle"
                            ? "text-slate-200"
                            : "text-slate-700"
                          : tier.name === "Oracle"
                          ? "text-slate-500"
                          : "text-slate-400"
                      }`}
                    >
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="max-w-5xl mx-auto px-6 md:px-12 pb-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">
            Compare Plans
          </h2>
          <p className="text-slate-500 mt-4 font-medium">
            A detailed breakdown of what each tier includes.
          </p>
        </div>

        <div className="glass rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left p-6 md:p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Feature
                  </th>
                  <th className="p-6 md:p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
                    Scholar
                  </th>
                  <th className="p-6 md:p-8 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600 text-center">
                    Tribune
                  </th>
                  <th className="p-6 md:p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
                    Oracle
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={
                      idx < comparisonFeatures.length - 1
                        ? "border-b border-slate-50"
                        : ""
                    }
                  >
                    <td className="p-5 md:p-6 text-sm font-bold text-slate-700">
                      {row.feature}
                    </td>
                    {(["scholar", "tribune", "oracle"] as const).map(
                      (tier) => {
                        const val = row[tier];
                        return (
                          <td
                            key={tier}
                            className="p-5 md:p-6 text-center"
                          >
                            {val === true ? (
                              <div className="inline-flex w-6 h-6 rounded-md bg-cyan-500 items-center justify-center">
                                <svg
                                  className="w-3.5 h-3.5 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={4}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            ) : val === false ? (
                              <div className="inline-flex w-6 h-6 rounded-md bg-slate-100 items-center justify-center">
                                <svg
                                  className="w-3.5 h-3.5 text-slate-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M18 12H6"
                                  />
                                </svg>
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-slate-600">
                                {val}
                              </span>
                            )}
                          </td>
                        );
                      }
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 md:px-12 pb-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">
            Subscription FAQ
          </h2>
        </div>

        <div className="space-y-3">
          {plusFaqs.map((faq, idx) => {
            const isOpen = openFaqs[idx] ?? false;
            return (
              <div
                key={idx}
                className={`glass rounded-[1.5rem] border transition-all duration-500 ${
                  isOpen
                    ? "border-cyan-200 shadow-lg"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-6 md:p-8 text-left"
                >
                  <span className="text-base font-bold text-slate-900 pr-8">
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      isOpen
                        ? "bg-cyan-500 text-white rotate-180"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-500 ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-6 md:px-8 pb-6 md:pb-8 text-sm text-slate-500 font-medium leading-relaxed border-t border-slate-100 pt-6">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-32">
        <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase mb-6">
              Ready to See the<br />
              <span className="text-cyan-400">Full Picture?</span>
            </h2>
            <p className="text-slate-400 font-medium max-w-lg mx-auto mb-10">
              Join thousands of crypto researchers who trust Confirmd for
              verified intelligence. Start with a 7-day free trial of
              Tribune.
            </p>
            <a
              href="#"
              className="inline-block bg-cyan-500 text-white text-[11px] font-black px-12 py-5 rounded-xl hover:bg-cyan-400 transition-all shadow-xl shadow-cyan-500/25 uppercase tracking-[0.2em]"
            >
              Start Free Trial
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlusPage;
