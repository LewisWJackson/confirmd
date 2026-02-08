import React from "react";

const AboutPage: React.FC = () => {
  return (
    <div className="relative z-10 animate-in">
      {/* Hero */}
      <section className="bg-surface-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-20">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-content-primary tracking-tighter leading-[0.85] mb-8">
            What is<br />
            Confirmd
          </h1>
          <p className="text-lg md:text-xl text-content-secondary font-medium leading-relaxed max-w-3xl">
            Confirmd is a crypto news verification platform built to separate
            signal from noise. We ingest claims from across the crypto
            ecosystem, extract verifiable assertions, and grade them against
            hard evidence -- so you never have to trade on hype alone.
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="bg-surface-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-content-primary tracking-tighter leading-tight mb-6">
                The Problem with<br />
                Crypto Misinformation
              </h2>
              <div className="space-y-5 text-content-secondary font-medium leading-relaxed">
                <p>
                  The crypto news ecosystem is broken. A rumor drops on X, hype
                  inflates on YouTube and Telegram, prices swing wildly, and by
                  the time the truth surfaces, the damage is done. Billions of
                  dollars in value are created or destroyed based on unverified
                  information.
                </p>
                <p>
                  Traditional media has little incentive to verify crypto-specific
                  claims -- they lack the technical expertise and the speed the
                  market demands. Crypto-native media, meanwhile, is often funded
                  by the very projects it covers.
                </p>
                <p>
                  The result? Traders, researchers, and enthusiasts are left to
                  navigate a minefield of sponsored content, anonymous rumors,
                  and selectively framed narratives with no reliable way to
                  separate fact from fiction.
                </p>
              </div>
            </div>
            <div className="bg-surface-card rounded-2xl border border-border p-10">
              <div className="space-y-8">
                {[
                  { stat: "67%", label: "of crypto news articles contain unverified claims" },
                  { stat: "$2.4B", label: "lost annually to hype-driven trading decisions" },
                  { stat: "< 5%", label: "of crypto outlets have formal verification processes" },
                ].map((item) => (
                  <div key={item.label} className="border-b border-border last:border-0 pb-6 last:pb-0">
                    <div className="text-4xl font-black text-accent tracking-tight mb-2">
                      {item.stat}
                    </div>
                    <p className="text-sm text-content-muted font-medium">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Thinking Freely */}
      <section className="bg-surface-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-content-primary tracking-tighter mb-6">
            Thinking Freely
          </h2>
          <p className="text-lg text-content-secondary font-medium leading-relaxed max-w-2xl mx-auto">
            We believe everyone deserves access to verified, transparent
            information. Our mission is to build the tools that make independent
            thinking possible in an ecosystem designed to manipulate.
          </p>
        </div>
      </section>

      {/* A Better Way */}
      <section className="bg-surface-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-24">
          <h2 className="text-4xl md:text-5xl font-black text-content-primary tracking-tighter leading-tight mb-6">
            A Better Way to<br />
            Read the News
          </h2>
          <p className="text-lg text-content-secondary font-medium leading-relaxed max-w-3xl mb-16">
            We asked a simple question: what if there was a platform that
            treated every crypto claim as a hypothesis to be tested, not a
            headline to be amplified? That question became Confirmd.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Ingest News",
                desc: "We monitor hundreds of crypto publishers, X accounts, Telegram channels, and regulatory filings in real time. Every new claim enters our pipeline within minutes.",
              },
              {
                step: "02",
                title: "Extract Claims",
                desc: "Our NLP pipeline identifies specific, falsifiable assertions inside each piece of content -- price targets, partnership announcements, regulatory filings, and more.",
              },
              {
                step: "03",
                title: "Verify with Evidence",
                desc: "Each claim is evaluated against primary sources, on-chain data, official filings, and cross-referenced reports. The result is a transparent verdict backed by graded evidence.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-surface-card rounded-2xl border border-border p-8 hover:bg-surface-card-hover transition-colors"
              >
                <div className="text-xs font-black text-accent uppercase tracking-[0.3em] mb-4">
                  Step {item.step}
                </div>
                <h3 className="text-xl font-black text-content-primary tracking-tight mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* See the Whole Picture */}
      <section className="bg-surface-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-24">
          <h2 className="text-4xl md:text-5xl font-black text-content-primary tracking-tighter mb-12">
            See the Whole Picture
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Bias",
                desc: "Every source is analyzed for promotional bias, FUD bias, and exchange favoritism. See how each outlet frames their reporting.",
              },
              {
                title: "Factuality",
                desc: "Claims are rated High, Mixed, or Low based on cross-referenced evidence from primary sources, on-chain data, and regulatory filings.",
              },
              {
                title: "Ownership",
                desc: "Know who funds the outlets you read. We track corporate ownership, VC backing, and exchange affiliations for every source.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-surface-card rounded-2xl border border-border p-8 hover:bg-surface-card-hover transition-colors"
              >
                <h3 className="text-lg font-black text-content-primary tracking-tight mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology Overview */}
      <section className="bg-surface-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-24">
          <h2 className="text-4xl md:text-5xl font-black text-content-primary tracking-tighter mb-6">
            Methodology
          </h2>
          <p className="text-lg text-content-secondary font-medium leading-relaxed max-w-3xl mb-12">
            Every claim processed by Confirmd receives a transparent verdict and
            evidence grade. Here is how we classify them.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                label: "Verified",
                color: "bg-factuality-high",
                textColor: "text-factuality-high",
                desc: "Strong primary-source evidence confirms the claim.",
              },
              {
                label: "Plausible",
                color: "bg-content-muted",
                textColor: "text-content-muted",
                desc: "Some supporting evidence exists but full verification is pending.",
              },
              {
                label: "Speculative",
                color: "bg-factuality-mixed",
                textColor: "text-factuality-mixed",
                desc: "Little to no verifiable evidence supports the claim.",
              },
              {
                label: "Misleading",
                color: "bg-factuality-low",
                textColor: "text-factuality-low",
                desc: "Evidence actively contradicts the claim.",
              },
            ].map((tier) => (
              <div
                key={tier.label}
                className="bg-surface-card rounded-2xl border border-border p-6 hover:bg-surface-card-hover transition-colors"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                  <span className={`text-sm font-black uppercase tracking-widest ${tier.textColor}`}>
                    {tier.label}
                  </span>
                </div>
                <p className="text-sm text-content-secondary leading-relaxed">
                  {tier.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <a
              href="/methodology"
              className="inline-block bg-accent text-accent-text text-sm font-black px-8 py-4 rounded-xl hover:bg-accent-hover transition-all uppercase tracking-wider"
            >
              Read Full Methodology
            </a>
          </div>
        </div>
      </section>

      {/* Not Your Average Newsletters */}
      <section className="bg-surface-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-24">
          <h2 className="text-4xl md:text-5xl font-black text-content-primary tracking-tighter mb-6">
            Not Your Average<br />
            Newsletters
          </h2>
          <p className="text-lg text-content-secondary font-medium leading-relaxed max-w-3xl mb-12">
            Our newsletters go beyond aggregation. Every story is
            factuality-rated, bias-checked, and ownership-tagged before it
            reaches your inbox.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Daily Briefing", desc: "Top 5 verified stories, every weekday morning." },
              { title: "Blindspot Report", desc: "Stories the mainstream crypto media is missing." },
              { title: "Weekly Digest", desc: "Comprehensive weekly review with trend analysis." },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-surface-card rounded-2xl border border-border p-8 hover:bg-surface-card-hover transition-colors"
              >
                <h3 className="text-lg font-black text-content-primary tracking-tight mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <a
              href="/newsletter"
              className="text-accent font-bold hover:underline"
            >
              Explore our newsletters
            </a>
          </div>
        </div>
      </section>

      {/* Company History */}
      <section className="bg-surface-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-24">
          <h2 className="text-4xl md:text-5xl font-black text-content-primary tracking-tighter mb-12">
            Company History
          </h2>

          <div className="space-y-8 max-w-3xl">
            {[
              {
                year: "2024",
                title: "The Idea",
                desc: "Confirmd was conceived by a team of crypto researchers and journalists who were tired of watching the same cycle: rumor, hype, crash, truth. They asked: what if we could verify in real time?",
              },
              {
                year: "2025",
                title: "Building the Pipeline",
                desc: "The first version of Confirmd's verification pipeline went live, processing claims from 50+ sources. Early users included fund managers, researchers, and content creators.",
              },
              {
                year: "2026",
                title: "Public Launch",
                desc: "Confirmd launched publicly with the Scholar (free), Tribune, and Oracle tiers. The platform now monitors 150+ sources and processes hundreds of claims daily.",
              },
            ].map((milestone) => (
              <div
                key={milestone.year}
                className="flex gap-6 items-start"
              >
                <div className="flex-shrink-0 w-16 text-right">
                  <span className="text-lg font-black text-accent">
                    {milestone.year}
                  </span>
                </div>
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-accent" />
                  <div className="w-0.5 flex-1 bg-border mt-1" />
                </div>
                <div className="pb-8">
                  <h3 className="text-lg font-black text-content-primary tracking-tight mb-2">
                    {milestone.title}
                  </h3>
                  <p className="text-sm text-content-secondary leading-relaxed">
                    {milestone.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="bg-surface-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-24">
          <h2 className="text-4xl md:text-5xl font-black text-content-primary tracking-tighter mb-6">
            Our Team
          </h2>
          <p className="text-lg text-content-secondary font-medium leading-relaxed max-w-3xl mb-12">
            Built by researchers, for the informed. Our team combines expertise
            in data science, journalism, blockchain technology, and
            verification methodology.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "500+", label: "Claims Tracked Monthly" },
              { value: "150+", label: "Sources Monitored" },
              { value: "4-Tier", label: "Verdict System" },
              { value: "A-D", label: "Evidence Grading" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-surface-card rounded-2xl border border-border p-8 text-center"
              >
                <div className="text-3xl font-black text-accent tracking-tight mb-2">
                  {stat.value}
                </div>
                <div className="text-xs font-black text-content-muted uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get in Touch */}
      <section className="bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-content-primary tracking-tighter mb-6">
                Get in Touch
              </h2>
              <p className="text-content-secondary font-medium leading-relaxed mb-8">
                Have questions about our methodology, want to report an
                inaccuracy, or interested in partnering? We would love to hear
                from you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/contact"
                  className="inline-block bg-accent text-accent-text text-sm font-black px-8 py-4 rounded-xl hover:bg-accent-hover transition-all uppercase tracking-wider text-center"
                >
                  Contact Us
                </a>
                <a
                  href="mailto:hello@confirmd.io"
                  className="inline-block bg-surface-card text-content-primary text-sm font-bold px-8 py-4 rounded-xl border border-border hover:bg-surface-card-hover transition-all text-center"
                >
                  hello@confirmd.io
                </a>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: "General", email: "hello@confirmd.io" },
                { label: "Press", email: "press@confirmd.io" },
                { label: "Privacy", email: "privacy@confirmd.io" },
                { label: "Careers", email: "careers@confirmd.io" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-surface-card rounded-xl border border-border p-5 flex items-center justify-between"
                >
                  <span className="text-sm font-bold text-content-primary">
                    {item.label}
                  </span>
                  <a
                    href={`mailto:${item.email}`}
                    className="text-sm text-accent font-bold hover:underline"
                  >
                    {item.email}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
