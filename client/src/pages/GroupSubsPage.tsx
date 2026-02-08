import React from "react";
import { useLocation } from "wouter";

const groupPlans = [
  {
    name: "Team",
    users: "5-10 users",
    price: "$7.49",
    priceNote: "per user/month",
    savings: "25% off individual pricing",
    features: [
      "All Tribune features for each member",
      "Shared team dashboard",
      "Team watchlists",
      "Centralized billing",
      "Priority onboarding",
    ],
  },
  {
    name: "Enterprise",
    users: "10+ users",
    price: "Custom",
    priceNote: "contact for pricing",
    savings: "Up to 50% off individual pricing",
    features: [
      "All Oracle features for each member",
      "Shared team dashboard",
      "Custom alert rules per team",
      "API access for integrations",
      "Dedicated account manager",
      "SLA guarantees",
      "SSO integration",
    ],
  },
];

const readerTestimonials = [
  {
    quote:
      "Our research team of 8 analysts now shares verified intelligence through Confirmd's team dashboard. It's eliminated duplicate verification work and saved us hours each week.",
    name: "Marc Savelli",
    title: "Head of Research, Digital Frontier Capital",
  },
  {
    quote:
      "As an educator, having group access means my entire classroom can learn to evaluate crypto claims with real tools. The institutional pricing makes it accessible for academic programs.",
    name: "Jenny Albright",
    title: "Professor of Financial Technology, Stanford",
  },
  {
    quote:
      "We onboarded our compliance team in under an hour. The shared dashboards mean everyone sees the same verified intelligence, which is critical for regulatory consistency.",
    name: "Jayden Bennett",
    title: "VP Operations, Pacific Digital Trust",
  },
];

const GroupSubsPage: React.FC = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h1 className="text-3xl md:text-5xl font-bold text-content-primary tracking-tight leading-tight mb-4">
            Get Confirmd for your classroom, organization, or institution.
          </h1>
          <p className="text-content-secondary text-lg max-w-2xl mb-8">
            Save up to 50% with our group subscription packages.
          </p>

          {/* How to purchase */}
          <div className="bg-surface-card border border-border rounded-xl p-6 md:p-8 mb-12">
            <h3 className="text-lg font-bold text-content-primary mb-4">How to purchase a group subscription</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-accent-text">1</span>
                </div>
                <div>
                  <p className="text-sm text-content-primary font-semibold">Choose your plan</p>
                  <p className="text-sm text-content-secondary">
                    Whether you are an educator teaching your classroom about media literacy or a manager who wants to ensure their employees are making data-driven decisions, choose the plan that fits your needs.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-accent-text">2</span>
                </div>
                <div>
                  <p className="text-sm text-content-primary font-semibold">Review your order</p>
                  <p className="text-sm text-content-secondary">
                    Select the number of subscriptions needed for your group. Group subscriptions between 5 and 9 are discounted at 25%, and orders between 10 and above are discounted at 50%.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-accent-text">3</span>
                </div>
                <div>
                  <p className="text-sm text-content-primary font-semibold">Onboard your team</p>
                  <p className="text-sm text-content-secondary">
                    After purchasing, you will receive email instructions on how to redeem your group subscription and get the most out of your Confirmd access.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trusted by logos placeholder */}
          <div className="text-center mb-16">
            <p className="text-content-muted text-xs uppercase tracking-wider mb-4">Trusted by readers of</p>
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

      {/* What our readers are saying */}
      <section className="bg-surface-secondary py-16">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h2 className="text-2xl md:text-3xl font-bold text-content-primary text-center mb-12">
            What our readers are saying
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {readerTestimonials.map((t, idx) => (
              <div key={idx} className="bg-surface-card border border-border rounded-xl p-6">
                <svg className="w-6 h-6 text-accent opacity-30 mb-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <blockquote className="text-sm text-content-primary leading-relaxed mb-4">
                  {t.quote}
                </blockquote>
                <div className="font-bold text-content-primary text-sm">{t.name}</div>
                <div className="text-content-muted text-xs">{t.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h2 className="text-2xl md:text-3xl font-bold text-content-primary text-center mb-4">
            Unlock unparalleled perspective with Confirmd
          </h2>
          <p className="text-content-secondary text-center max-w-2xl mx-auto mb-12">
            Bulk subscriptions as low as $4.99 per user per month.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {groupPlans.map((plan) => (
              <div
                key={plan.name}
                className="bg-surface-card border border-border rounded-xl p-8 flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-content-primary">{plan.name}</h3>
                  <span className="text-xs font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full">
                    {plan.users}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-3xl font-bold text-content-primary">{plan.price}</span>
                  <span className="text-content-muted text-sm ml-1">{plan.priceNote}</span>
                </div>
                <p className="text-xs text-accent font-semibold mb-6">{plan.savings}</p>

                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-content-primary">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    window.location.href = `mailto:hello@confirmd.io?subject=${encodeURIComponent(`${plan.name} Group Subscription Inquiry`)}`;
                  }}
                  className="w-full py-3 border border-accent text-accent rounded-lg text-sm font-bold hover:bg-accent hover:text-accent-text transition-all"
                >
                  {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                </button>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="rounded-xl border border-border overflow-hidden bg-surface-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-content-muted">Feature</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-content-muted text-center">Team</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-content-muted text-center">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Evidence Ladders", team: true, enterprise: true },
                    { feature: "Source Credibility Scores", team: true, enterprise: true },
                    { feature: "Real-Time Alerts", team: true, enterprise: true },
                    { feature: "Shared Dashboard", team: true, enterprise: true },
                    { feature: "API Access", team: false, enterprise: true },
                    { feature: "Data Export", team: false, enterprise: true },
                    { feature: "SSO Integration", team: false, enterprise: true },
                    { feature: "Dedicated Account Manager", team: false, enterprise: true },
                  ].map((row, idx) => (
                    <tr key={row.feature} className={idx < 7 ? "border-b border-border" : ""}>
                      <td className="p-4 text-sm font-semibold text-content-primary">{row.feature}</td>
                      <td className="p-4 text-center">
                        {row.team ? (
                          <svg className="w-5 h-5 text-accent mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-content-muted mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.enterprise ? (
                          <svg className="w-5 h-5 text-accent mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-content-muted mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <button
              onClick={() => {
                window.location.href = "mailto:hello@confirmd.io?subject=Group%20Subscription%20Inquiry";
              }}
              className="bg-accent text-accent-text px-8 py-3 rounded-lg text-sm font-bold hover:bg-accent-hover transition-all"
            >
              Get Group Pricing
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GroupSubsPage;
