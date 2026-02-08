import React from "react";

const MethodologyPage: React.FC = () => {
  return (
    <div className="relative z-10 animate-in">
      {/* Hero */}
      <section className="bg-surface-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-16">
          <h1 className="text-6xl md:text-8xl font-black text-content-primary tracking-tighter leading-[0.9] mb-6">
            Methodology
          </h1>
          <p className="text-lg md:text-xl text-content-secondary font-medium leading-relaxed max-w-3xl">
            Confirmd was built with one goal: arm crypto participants with
            verified, transparent information. We take a comprehensive,
            data-driven approach to news verification. Here is exactly how our
            system works.
          </p>
        </div>
      </section>

      {/* Factuality Score */}
      <section className="bg-surface-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
          <h2 className="text-3xl md:text-5xl font-black text-content-primary tracking-tighter mb-4">
            Factuality Score
          </h2>
          <p className="text-content-secondary font-medium leading-relaxed max-w-3xl mb-12">
            The Factuality Score represents the overall reliability of a claim
            or source based on our evidence analysis. It is determined by
            cross-referencing primary sources, on-chain data, regulatory
            filings, and multiple independent reports.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* High */}
            <div className="bg-surface-card rounded-2xl border border-border p-8 hover:bg-surface-card-hover transition-colors">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-4 h-4 rounded-full bg-factuality-high" />
                <span className="text-sm font-black text-factuality-high uppercase tracking-widest">
                  High
                </span>
              </div>
              <p className="text-content-secondary text-sm leading-relaxed">
                Strong primary-source evidence confirms the claim. Multiple
                high-grade sources corroborate. The factual basis is well
                established and verified through independent channels.
              </p>
              <div className="mt-6 flex items-center space-x-2">
                <div className="flex-1 h-2 rounded-full bg-factuality-high" />
                <span className="text-xs font-bold text-content-muted">
                  80-100%
                </span>
              </div>
            </div>

            {/* Mixed */}
            <div className="bg-surface-card rounded-2xl border border-border p-8 hover:bg-surface-card-hover transition-colors">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-4 h-4 rounded-full bg-factuality-mixed" />
                <span className="text-sm font-black text-factuality-mixed uppercase tracking-widest">
                  Mixed
                </span>
              </div>
              <p className="text-content-secondary text-sm leading-relaxed">
                Some supporting evidence exists, but not enough for full
                verification. May include conflicting sources or incomplete
                data. Worth watching as new evidence emerges.
              </p>
              <div className="mt-6 flex items-center space-x-2">
                <div className="flex-1 h-2 rounded-full bg-factuality-mixed" />
                <span className="text-xs font-bold text-content-muted">
                  40-79%
                </span>
              </div>
            </div>

            {/* Low */}
            <div className="bg-surface-card rounded-2xl border border-border p-8 hover:bg-surface-card-hover transition-colors">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-4 h-4 rounded-full bg-factuality-low" />
                <span className="text-sm font-black text-factuality-low uppercase tracking-widest">
                  Low
                </span>
              </div>
              <p className="text-content-secondary text-sm leading-relaxed">
                Little to no verifiable evidence supports the claim, or
                evidence actively contradicts it. Often based on rumors,
                unnamed sources, or extrapolation with known inaccuracies.
              </p>
              <div className="mt-6 flex items-center space-x-2">
                <div className="flex-1 h-2 rounded-full bg-factuality-low" />
                <span className="text-xs font-bold text-content-muted">
                  0-39%
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rating Description */}
      <section className="bg-surface-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
          <h2 className="text-3xl md:text-5xl font-black text-content-primary tracking-tighter mb-4">
            Rating Description
          </h2>
          <p className="text-content-secondary font-medium leading-relaxed max-w-3xl mb-12">
            The Confirmd rating system classifies sources and claims along
            multiple dimensions. Here is how we categorize each aspect of our
            analysis.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: "Far Left", desc: "Strong progressive bias in reporting" },
              { label: "Lean Left", desc: "Moderate progressive leaning" },
              { label: "Center", desc: "Balanced, neutral reporting" },
              { label: "Lean Right", desc: "Moderate conservative leaning" },
              { label: "Far Right", desc: "Strong conservative bias in reporting" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-surface-card rounded-xl border border-border p-5 hover:bg-surface-card-hover transition-colors"
              >
                <div className="text-sm font-black text-content-primary uppercase tracking-wider mb-2">
                  {item.label}
                </div>
                <p className="text-xs text-content-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-surface-card rounded-xl border border-border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-content-primary">
                Note on Crypto Bias
              </span>
            </div>
            <p className="text-sm text-content-secondary leading-relaxed">
              In the crypto ecosystem, bias is not always political. We also
              assess promotional bias (shilling), FUD (fear, uncertainty, doubt)
              bias, and exchange or protocol favoritism. Our system accounts for
              all these dimensions when evaluating source reliability.
            </p>
          </div>
        </div>
      </section>

      {/* Ownership Categories */}
      <section className="bg-surface-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-black text-content-primary tracking-tighter mb-4 text-right">
              Ownership Categories
            </h2>
            <p className="text-content-secondary font-medium leading-relaxed mb-12 text-right">
              The ownership categories for each news source were
              determined by analyzing financial records, corporate filings,
              and public disclosures to identify who funds each outlet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Independent",
                desc: "Independently owned outlets with no major corporate or institutional backing. Revenue comes from subscriptions, donations, or small-scale advertising.",
              },
              {
                title: "VC-Backed",
                desc: "Outlets funded wholly or in part by venture capital firms. May have financial interests in the protocols or tokens they cover.",
              },
              {
                title: "Exchange-Owned",
                desc: "Media outlets owned by or affiliated with cryptocurrency exchanges. Coverage may favor the owning exchange's products or listings.",
              },
              {
                title: "Corporate Media",
                desc: "Subsidiaries of large media conglomerates. Crypto coverage is one vertical among many, with editorial direction from parent company.",
              },
              {
                title: "Protocol-Affiliated",
                desc: "Content producers directly affiliated with a blockchain protocol, foundation, or DAO. Primarily promotional in nature.",
              },
              {
                title: "Community-Driven",
                desc: "Decentralized or community-governed outlets. Content is contributed by multiple authors with varying levels of editorial oversight.",
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

      {/* Formula */}
      <section className="bg-surface-primary">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
          <h2 className="text-3xl md:text-5xl font-black text-content-primary tracking-tighter mb-4">
            Formula
          </h2>
          <p className="text-content-secondary font-medium leading-relaxed max-w-3xl mb-12">
            Our composite factuality score is derived from multiple weighted
            factors, each contributing to a final reliability assessment.
          </p>

          <div className="space-y-6">
            {[
              {
                number: "1",
                title: "Evidence Strength",
                weight: "40%",
                desc: "A weighted average of all evidence grades (A-D) supporting or contradicting a claim. Primary-source evidence (Grade A) receives the highest weight.",
              },
              {
                number: "2",
                title: "Source Track Record",
                weight: "25%",
                desc: "Historical accuracy of the publishing source. Calculated from the ratio of previously verified vs. misleading claims from the same outlet.",
              },
              {
                number: "3",
                title: "Cross-Reference Density",
                weight: "20%",
                desc: "How many independent sources report the same claim. A claim corroborated by 5+ independent outlets scores higher than a single-source report.",
              },
              {
                number: "4",
                title: "Recency & Relevance",
                weight: "15%",
                desc: "Time-decay factor that weights recent evidence more heavily. Also considers whether the claim's subject matter is within the source's known area of expertise.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="bg-surface-card rounded-2xl border border-border p-8 hover:bg-surface-card-hover transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-black text-accent-text">
                          {item.number}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-content-primary tracking-tight">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-sm text-content-secondary leading-relaxed ml-14">
                      {item.desc}
                    </p>
                  </div>
                  <div className="ml-14 md:ml-0 flex-shrink-0">
                    <div className="inline-block bg-accent/10 border border-accent/30 rounded-xl px-5 py-2">
                      <span className="text-xl font-black text-accent">
                        {item.weight}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-surface-card rounded-2xl border border-border p-8">
            <h3 className="text-lg font-black text-content-primary tracking-tight mb-4">
              Final Score Calculation
            </h3>
            <div className="bg-surface-primary rounded-xl border border-border p-6 font-mono text-sm text-content-secondary">
              <p>Factuality Score = (Evidence Strength x 0.40) + (Source Track Record x 0.25) + (Cross-Reference Density x 0.20) + (Recency & Relevance x 0.15)</p>
            </div>
            <p className="text-sm text-content-muted mt-4 leading-relaxed">
              Each component is normalized to a 0-100 scale before weighting.
              The final composite score maps to High (80-100), Mixed (40-79),
              or Low (0-39) factuality ratings displayed throughout the platform.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MethodologyPage;
