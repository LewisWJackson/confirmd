import React, { useState } from "react";

const NewsletterPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail("");
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <div className="relative z-10 animate-in">
      {/* Hero */}
      <section className="bg-surface-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-7xl font-black text-content-primary tracking-tighter leading-[0.9] mb-6">
                Stay Informed daily<br />
                with the Daily Ground
              </h1>
              <p className="text-lg text-content-secondary font-medium leading-relaxed max-w-xl mb-8">
                Get the most important crypto news delivered to your inbox,
                verified and rated for factuality. No hype, no shilling -- just
                the verified truth.
              </p>

              {/* Email Signup Form */}
              <form onSubmit={handleSubmit} className="max-w-md">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="flex-1 bg-surface-card border border-border rounded-xl px-5 py-4 text-sm font-medium text-content-primary focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-all placeholder:text-content-muted"
                  />
                  <button
                    type="submit"
                    className="bg-accent text-accent-text text-sm font-black px-8 py-4 rounded-xl hover:bg-accent-hover transition-all uppercase tracking-wider flex-shrink-0"
                  >
                    Sign Up
                  </button>
                </div>
                <p className="text-xs text-content-muted mt-3">
                  Free. No spam. Unsubscribe anytime.
                </p>
              </form>

              {/* Success Toast */}
              {submitted && (
                <div className="mt-4 bg-factuality-high/10 border border-factuality-high/30 rounded-xl px-5 py-3 inline-flex items-center space-x-2 animate-in">
                  <svg className="w-5 h-5 text-factuality-high flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-bold text-factuality-high">
                    You are subscribed! Check your inbox to confirm.
                  </span>
                </div>
              )}
            </div>

            <div className="hidden lg:block">
              <div className="bg-surface-card rounded-2xl border border-border p-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-black text-content-primary">The Daily Confirmd</div>
                    <div className="text-xs text-content-muted">Delivered every weekday</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {["SEC announces new crypto custody framework", "Bitcoin mining difficulty reaches all-time high", "Major DeFi protocol patches critical vulnerability"].map((headline, i) => (
                    <div key={i} className="flex items-start space-x-3 py-3 border-b border-border last:border-0">
                      <span className="text-accent font-black text-lg">{i + 1}</span>
                      <div>
                        <p className="text-sm font-bold text-content-primary">{headline}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="w-2 h-2 rounded-full bg-factuality-high" />
                          <span className="text-xs text-content-muted">High Factuality</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Stories Preview */}
      <section className="bg-surface-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
          <h2 className="text-3xl md:text-4xl font-black text-content-primary tracking-tighter mb-12">
            Top Stories
          </h2>

          <div className="space-y-6">
            {[
              {
                rank: 1,
                title: "Ethereum Layer 2 protocols report record throughput as mainnet gas fees stabilize",
                sources: 14,
                factuality: "high" as const,
              },
              {
                rank: 2,
                title: "South Korean crypto exchange reports $200M in daily volume amid regulatory clarity",
                sources: 8,
                factuality: "high" as const,
              },
              {
                rank: 3,
                title: "NASDAQ now allowing institutional investors to trade crypto ETFs in retirement accounts",
                sources: 11,
                factuality: "mixed" as const,
              },
              {
                rank: 4,
                title: "Stablecoin market cap crosses $300B for first time as institutional adoption accelerates",
                sources: 6,
                factuality: "high" as const,
              },
              {
                rank: 5,
                title: "Nigerian court orders exchange to pay $870 million in penalties for operating without license",
                sources: 5,
                factuality: "mixed" as const,
              },
            ].map((story) => (
              <div
                key={story.rank}
                className="bg-surface-card rounded-2xl border border-border p-6 hover:bg-surface-card-hover transition-colors flex items-start gap-5"
              >
                <span className="text-3xl font-black text-accent flex-shrink-0 w-10">
                  {story.rank}
                </span>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-content-primary leading-snug mb-2">
                    {story.title}
                  </h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-content-muted">
                      {story.sources} sources
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          story.factuality === "high"
                            ? "bg-factuality-high"
                            : story.factuality === "mixed"
                            ? "bg-factuality-mixed"
                            : "bg-factuality-low"
                        }`}
                      />
                      <span className="text-xs text-content-muted capitalize">
                        {story.factuality} Factuality
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blindspot Section */}
      <section className="bg-surface-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
          <h2 className="text-3xl md:text-4xl font-black text-content-primary tracking-tighter mb-4">
            Blindspot
          </h2>
          <p className="text-content-secondary font-medium leading-relaxed max-w-2xl mb-12">
            Stories that are getting significant attention but may be under-reported
            by mainstream crypto outlets. The Blindspot Report is included in every
            newsletter.
          </p>

          <div className="bg-surface-card rounded-2xl border border-border p-8">
            <h3 className="text-lg font-bold text-content-primary mb-6">
              Which side of the market is covering this story more?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface-primary rounded-xl border border-border p-6 text-center">
                <div className="text-sm font-black text-content-primary uppercase tracking-wider mb-2">
                  Bullish Outlets
                </div>
                <p className="text-xs text-content-muted">
                  See which pro-crypto sources are covering this
                </p>
              </div>
              <div className="bg-surface-primary rounded-xl border border-border p-6 text-center">
                <div className="text-sm font-black text-content-primary uppercase tracking-wider mb-2">
                  Skeptical Outlets
                </div>
                <p className="text-xs text-content-muted">
                  See which critical sources are covering this
                </p>
              </div>
            </div>
            <p className="text-xs text-content-muted mt-6 text-center">
              Want to see personalized coverage analysis?{" "}
              <a href="/plus" className="text-accent font-bold hover:underline">
                Subscribe to Confirmd+
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* All Newsletters */}
      <section className="bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
          <h2 className="text-3xl md:text-4xl font-black text-content-primary tracking-tighter mb-4">
            Check out all of our Newsletters
          </h2>
          <p className="text-content-secondary font-medium leading-relaxed mb-12">
            From daily briefings to weekly deep dives, choose the newsletters
            that match your information needs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Daily Briefing",
                frequency: "Every weekday",
                desc: "Top 5 verified crypto stories, factuality-rated and summarized. Takes 3 minutes to read.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ),
              },
              {
                title: "Blindspot Report",
                frequency: "Twice weekly",
                desc: "Stories the mainstream crypto media is missing. See what the other side of the market is talking about.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ),
              },
              {
                title: "Weekly Digest",
                frequency: "Every Sunday",
                desc: "A comprehensive look back at the week's most important verified developments, with trend analysis.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ),
              },
            ].map((newsletter) => (
              <div
                key={newsletter.title}
                className="bg-surface-card rounded-2xl border border-border p-8 hover:bg-surface-card-hover transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent mb-6">
                  {newsletter.icon}
                </div>
                <h3 className="text-lg font-black text-content-primary tracking-tight mb-1">
                  {newsletter.title}
                </h3>
                <div className="text-xs font-bold text-accent uppercase tracking-wider mb-3">
                  {newsletter.frequency}
                </div>
                <p className="text-sm text-content-secondary leading-relaxed mb-6">
                  {newsletter.desc}
                </p>
                <button
                  onClick={() => {
                    const el = document.querySelector("input[type='email']");
                    if (el) (el as HTMLInputElement).focus();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-sm font-bold text-accent hover:underline"
                >
                  Subscribe
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default NewsletterPage;
