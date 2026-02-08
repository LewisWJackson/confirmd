import React from "react";
import { useLocation } from "wouter";
import { createCheckoutSession } from "../lib/api";

const features = [
  {
    title: "All sources in one place",
    description: "Never miss a story with the most comprehensive crypto source aggregation available. 100+ sources, one dashboard.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    title: "Compare coverage across sources",
    description: "See how different sources cover the same claim. Identify blind spots in your information diet instantly.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: "Factuality ratings",
    description: "Every claim gets a transparent, evidence-based verdict. Know exactly how much you can trust a piece of information.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Blindspot detection",
    description: "Discover stories and claims that your usual sources aren't covering. Stay ahead of the narrative, not behind it.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
];

const TrialPage: React.FC = () => {
  const [, setLocation] = useLocation();

  const handleStartTrial = async () => {
    try {
      const { url } = await createCheckoutSession("tribune");
      if (url) window.location.href = url;
    } catch {
      setLocation("/signup");
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Hero */}
      <section className="py-16 md:py-24 bg-surface-secondary">
        <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-content-primary tracking-tight leading-tight mb-4">
            There's a better way to read the news.
          </h1>
          <p className="text-content-secondary text-lg max-w-2xl mx-auto mb-2">
            Get 7-days of Premium for FREE.
          </p>
          <p className="text-content-muted text-sm mb-8">
            Then $9.99/month billed annually. Cancel anytime.
          </p>

          <button
            onClick={handleStartTrial}
            className="bg-accent text-accent-text px-10 py-4 rounded-lg text-sm font-bold hover:bg-accent-hover transition-all"
          >
            Start My Free Trial
          </button>

          {/* Trusted by logos */}
          <div className="mt-12">
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

      {/* Feature highlights */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="text-center mb-12">
            <h2 className="text-sm font-bold text-accent uppercase tracking-wider mb-2">What you get</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-surface-card border border-border rounded-xl p-6 hover:bg-surface-card-hover transition-all"
              >
                <div className="text-accent mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-content-primary mb-2">{f.title}</h3>
                <p className="text-sm text-content-secondary leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* We're not better news section */}
      <section className="bg-surface-secondary py-16">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-content-primary leading-tight mb-6">
                We're not better news, we're a better way to read it.
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-card border border-border flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-content-primary text-sm mb-1">Access claims from over 100+ sources in one place</h3>
                    <p className="text-content-secondary text-sm">
                      Never miss a story with the most comprehensive crypto intelligence aggregation available. From regulators to influencers, all in one dashboard.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-card border border-border flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-content-primary text-sm mb-1">See how claims hold up across the spectrum</h3>
                    <p className="text-content-secondary text-sm">
                      For the first time, see the evidence behind every verdict. Compare what different sources are saying and evaluate the strength of each claim.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-card border border-border flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-content-primary text-sm mb-1">Find every article on a claim, grouped in one place</h3>
                    <p className="text-content-secondary text-sm">
                      For each story, see the articles from every source, the evidence for and against, and the overall confidence score. All in one place.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image placeholder */}
            <div className="flex-shrink-0 w-full md:w-1/3">
              <div className="bg-surface-card border border-border rounded-xl h-72 flex items-center justify-center">
                <span className="text-content-muted text-sm italic">App preview</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <h2 className="text-2xl md:text-3xl font-bold text-content-primary text-center mb-12">
            What others are saying...
          </h2>

          <div className="bg-surface-card border border-border rounded-xl p-8 md:p-12">
            <svg className="w-10 h-10 text-accent opacity-30 mb-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>

            <blockquote className="text-lg text-content-primary leading-relaxed mb-6">
              Confirmd has made following the news more approachable, informative, and engaging.
              I used to be comfortable in my bubble, only reading sources that I trusted.
              In all honesty, I never realized how overwhelming and intimidating it can be to navigate
              crypto news without proper tools. Confirmd changed that for me. I am proud to say
              that I've "burst my bubble."
            </blockquote>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <span className="text-xs font-bold text-accent-text">SB</span>
              </div>
              <div>
                <div className="font-bold text-content-primary text-sm">Sarah Blair</div>
                <div className="text-content-muted text-xs">Chairwoman of the West Virginia Forum of Exchanges</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-surface-secondary py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-content-primary mb-3">
            Try Confirmd Premium FREE for 7 days
          </h2>
          <p className="text-content-muted text-sm mb-8">
            Then $9.99/month billed annually. Renews automatically.
          </p>
          <button
            onClick={handleStartTrial}
            className="bg-accent text-accent-text px-10 py-4 rounded-lg text-sm font-bold hover:bg-accent-hover transition-all"
          >
            Start My Free Trial
          </button>
        </div>
      </section>
    </div>
  );
};

export default TrialPage;
