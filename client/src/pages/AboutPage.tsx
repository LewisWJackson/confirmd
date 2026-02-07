import React from "react";

const AboutPage: React.FC = () => {
  return (
    <div className="relative z-10 animate-in">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-block px-5 py-2 bg-cyan-50 border border-cyan-100 rounded-full mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600">
              About Confirmd
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9] mb-8">
            Clarity Over<br />
            <span className="text-cyan-600">Hype</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
            Confirmd is a crypto news verification platform built to separate
            signal from noise. We ingest claims from across the crypto
            ecosystem, extract verifiable assertions, and grade them against
            hard evidence -- so you never have to trade on hype alone.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">
            How It Works
          </h2>
          <p className="text-slate-500 mt-4 font-medium">
            Three stages. Zero guesswork.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Ingest News",
              description:
                "We monitor hundreds of crypto publishers, X accounts, Telegram channels, and regulatory filings in real time. Every new claim enters our pipeline within minutes.",
              icon: (
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              ),
            },
            {
              step: "02",
              title: "Extract Claims",
              description:
                "Our NLP pipeline identifies specific, falsifiable assertions inside each piece of content -- price targets, partnership announcements, regulatory filings, and more.",
              icon: (
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              ),
            },
            {
              step: "03",
              title: "Verify with Evidence",
              description:
                "Each claim is evaluated against primary sources, on-chain data, official filings, and cross-referenced reports. The result is a transparent verdict backed by graded evidence.",
              icon: (
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              ),
            },
          ].map((item) => (
            <div
              key={item.step}
              className="glass rounded-[2.5rem] p-10 border border-slate-100 hover:border-cyan-200 transition-all duration-500 group hover:shadow-2xl"
            >
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform shadow-sm border border-cyan-100">
                  {item.icon}
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                  Step {item.step}
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4">
                {item.title}
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Connector arrows visible on desktop */}
        <div className="hidden md:flex justify-center items-center -mt-[13rem] mb-[10rem] pointer-events-none">
          <div className="flex items-center space-x-4 max-w-2xl w-full justify-between px-16">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center">
                <div className="w-24 h-[2px] bg-gradient-to-r from-cyan-200 to-cyan-400" />
                <svg
                  className="w-4 h-4 text-cyan-400 -ml-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verification Methodology */}
      <section className="bg-slate-900 text-white py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 block mb-4">
              Methodology
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">
              Verification System
            </h2>
            <p className="text-slate-400 mt-6 font-medium max-w-xl mx-auto">
              Every claim processed by Confirmd receives a transparent verdict
              and evidence grade. Here is how we classify them.
            </p>
          </div>

          {/* Verdict Tiers */}
          <div className="mb-24">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8">
              4-Tier Verdict System
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: "Verified",
                  color: "cyan",
                  bgClass: "bg-cyan-500/10 border-cyan-500/30",
                  dotClass: "bg-cyan-500 shadow-[0_0_12px_cyan]",
                  textClass: "text-cyan-400",
                  desc: "Strong primary-source evidence confirms the claim. Multiple high-grade sources corroborate.",
                },
                {
                  label: "Plausible",
                  color: "slate",
                  bgClass: "bg-slate-700/50 border-slate-600",
                  dotClass: "bg-slate-400",
                  textClass: "text-slate-300",
                  desc: "Some supporting evidence exists, but not enough for full verification. Worth watching.",
                },
                {
                  label: "Speculative",
                  color: "orange",
                  bgClass: "bg-orange-500/10 border-orange-500/30",
                  dotClass: "bg-orange-500 shadow-[0_0_12px_orange]",
                  textClass: "text-orange-400",
                  desc: "Little to no verifiable evidence. Often based on rumors, unnamed sources, or extrapolation.",
                },
                {
                  label: "Misleading",
                  color: "red",
                  bgClass: "bg-red-500/10 border-red-500/30",
                  dotClass: "bg-red-500 shadow-[0_0_12px_red]",
                  textClass: "text-red-400",
                  desc: "Evidence actively contradicts the claim. May contain distortions, fabrications, or selective omissions.",
                },
              ].map((tier) => (
                <div
                  key={tier.label}
                  className={`rounded-[2rem] p-8 border ${tier.bgClass} transition-all hover:scale-[1.02]`}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${tier.dotClass}`} />
                    <span
                      className={`text-sm font-black uppercase tracking-widest ${tier.textClass}`}
                    >
                      {tier.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium">
                    {tier.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Grading */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8">
              Evidence Grading (A-D)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  grade: "A",
                  title: "Primary Source",
                  desc: "Official filings, on-chain transactions, direct statements from principals.",
                  barWidth: "100%",
                },
                {
                  grade: "B",
                  title: "Reliable Secondary",
                  desc: "Established news outlets with editorial standards, verified insiders.",
                  barWidth: "75%",
                },
                {
                  grade: "C",
                  title: "Mixed Reliability",
                  desc: "Community reports, unverified but plausible sources, aggregator summaries.",
                  barWidth: "50%",
                },
                {
                  grade: "D",
                  title: "Low Reliability",
                  desc: "Anonymous tips, unverified social media, known hype accounts.",
                  barWidth: "25%",
                },
              ].map((g) => (
                <div
                  key={g.grade}
                  className="rounded-[2rem] bg-slate-800/50 border border-slate-700 p-8"
                >
                  <div className="text-4xl font-black text-cyan-400 mb-3">
                    {g.grade}
                  </div>
                  <div className="text-sm font-black text-white uppercase tracking-wider mb-2">
                    {g.title}
                  </div>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
                    {g.desc}
                  </p>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all"
                      style={{ width: g.barWidth }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600 block mb-4">
              Our Story
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase mb-8">
              Built by Researchers,<br />
              for the Informed
            </h2>
            <div className="space-y-6 text-slate-500 font-medium leading-relaxed">
              <p>
                Confirmd was founded by a team of crypto researchers, data
                scientists, and journalists who were tired of watching the
                same cycle repeat: a rumor drops, hype inflates, prices
                swing, and by the time the truth surfaces, the damage is
                done.
              </p>
              <p>
                We asked a simple question: what if there was a platform
                that treated every crypto claim as a hypothesis to be tested,
                not a headline to be amplified? That question became Confirmd.
              </p>
              <p>
                Today, our verification pipeline processes hundreds of
                claims daily, drawing on primary sources, on-chain data,
                regulatory filings, and cross-referenced reporting to deliver
                verdicts you can trust.
              </p>
            </div>
          </div>
          <div className="glass rounded-[3rem] p-12 border border-slate-100 shadow-xl">
            <div className="grid grid-cols-2 gap-8">
              {[
                { value: "500+", label: "Claims Tracked Monthly" },
                { value: "150+", label: "Sources Monitored" },
                { value: "4-Tier", label: "Verdict System" },
                { value: "A-D", label: "Evidence Grading" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-black text-cyan-600 tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">
            Our Values
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              title: "Transparency",
              desc: "Every verdict we publish comes with a full evidence ladder. We show our work so you can evaluate it yourself.",
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ),
            },
            {
              title: "Accuracy",
              desc: "We measure ourselves by track record. Every verdict is auditable, and our historical accuracy is public.",
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              title: "Independence",
              desc: "We take no positions, hold no tokens we cover, and accept no payment for verdicts. Our only bias is toward truth.",
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              ),
            },
            {
              title: "Open Methodology",
              desc: "Our verification methodology is fully documented. We believe open systems build more trust than black boxes.",
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              ),
            },
          ].map((value) => (
            <div
              key={value.title}
              className="glass rounded-[2rem] p-8 border border-slate-100 hover:border-cyan-200 transition-all duration-500 hover:shadow-xl group"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 mb-6 group-hover:scale-110 transition-transform border border-cyan-100">
                {value.icon}
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-3 uppercase">
                {value.title}
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {value.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-32">
        <div className="glass rounded-[3rem] p-12 md:p-16 border border-slate-100 shadow-xl text-center">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">
            Get In Touch
          </h2>
          <p className="text-slate-500 font-medium mb-8 max-w-lg mx-auto">
            Have questions about our methodology, want to report an
            inaccuracy, or interested in partnering? We would love to hear
            from you.
          </p>
          <a
            href="mailto:hello@confirmd.io"
            className="inline-block bg-slate-900 text-white text-[11px] font-black px-10 py-4 rounded-xl hover:bg-cyan-600 transition-all shadow-xl uppercase tracking-[0.2em]"
          >
            hello@confirmd.io
          </a>
          <div className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            @confirmd on X
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
