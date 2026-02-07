import React, { useState } from "react";

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

interface FaqCategory {
  name: string;
  items: FaqItem[];
}

const faqData: FaqCategory[] = [
  {
    name: "General",
    items: [
      {
        question: "What is Confirmd?",
        answer: (
          <span>
            Confirmd is a crypto news verification platform that ingests claims
            from across the crypto ecosystem, extracts falsifiable assertions,
            and evaluates them against primary-source evidence. Think of it as a
            fact-checking layer for crypto -- designed for traders, researchers,
            and anyone tired of making decisions based on hype. Learn more on
            our{" "}
            <a href="/about" className="text-cyan-600 font-bold hover:underline">
              About page
            </a>
            .
          </span>
        ),
      },
      {
        question: "Who is Confirmd for?",
        answer:
          "Confirmd is built for crypto traders, researchers, journalists, fund managers, and enthusiasts who want verified information before they act. Whether you are evaluating a rumor about an ETF filing or checking if a partnership announcement is real, Confirmd gives you the evidence to decide for yourself.",
      },
      {
        question: "How often is news updated?",
        answer:
          "Our ingestion pipeline runs continuously, monitoring sources in near real-time. New claims typically appear within minutes of publication. Verification verdicts are updated as new evidence surfaces, so a claim's status may evolve over time.",
      },
      {
        question: "Is Confirmd free to use?",
        answer: (
          <span>
            Yes. The Scholar tier is completely free and gives you access to the
            main feed, basic claim details, and a limited watchlist. For power
            users, our Tribune and Oracle tiers unlock full evidence ladders,
            real-time alerts, API access, and more. See the{" "}
            <a href="/plus" className="text-cyan-600 font-bold hover:underline">
              Confirmd Plus
            </a>{" "}
            page for details.
          </span>
        ),
      },
    ],
  },
  {
    name: "Verification System",
    items: [
      {
        question: "How does Confirmd verify claims?",
        answer:
          "Each claim passes through a multi-stage pipeline: (1) Ingestion from monitored sources, (2) NLP-based extraction of specific, falsifiable assertions, (3) Evidence matching against primary sources, on-chain data, regulatory filings, and cross-referenced reports, and (4) Verdict assignment with a probability score and evidence strength rating. The entire process is designed for transparency -- every verdict links back to its supporting evidence.",
      },
      {
        question: "What do the verdict labels mean?",
        answer: (
          <span>
            We use a 4-tier system:{" "}
            <strong className="text-cyan-600">Verified</strong> means strong
            primary-source evidence confirms the claim.{" "}
            <strong className="text-slate-600">Plausible</strong> means some
            supporting evidence exists but full verification is pending.{" "}
            <strong className="text-orange-600">Speculative</strong> means
            little to no verifiable evidence supports the claim.{" "}
            <strong className="text-red-600">Misleading</strong> means evidence
            actively contradicts the claim. More details are on our{" "}
            <a href="/about" className="text-cyan-600 font-bold hover:underline">
              About page
            </a>
            .
          </span>
        ),
      },
      {
        question: "How are source credibility scores calculated?",
        answer:
          "Each source is scored across multiple dimensions: Track Record (historical accuracy of their claims), Method Discipline (whether they cite sources, use hedging language, and correct errors), and Sample Size (volume of claims we have analyzed). These factors produce a composite score with a confidence interval that tightens as we accumulate more data.",
      },
      {
        question: "What are evidence grades (A through D)?",
        answer:
          "Evidence grade reflects the reliability of a supporting or contradicting source. Grade A is primary-source evidence (official filings, on-chain data). Grade B is reliable secondary reporting (established outlets with editorial standards). Grade C is mixed-reliability sources (community reports, aggregators). Grade D is low-reliability sources (anonymous tips, unverified social media).",
      },
    ],
  },
  {
    name: "Features",
    items: [
      {
        question: "What is the Blindspot feature?",
        answer: (
          <span>
            Blindspot surfaces claims that our system flags as speculative or
            misleading but that are receiving significant attention in the
            crypto ecosystem. It is designed to highlight narratives you should
            approach with caution. Visit the{" "}
            <a
              href="/blindspot"
              className="text-cyan-600 font-bold hover:underline"
            >
              Blindspot page
            </a>{" "}
            to see currently flagged claims.
          </span>
        ),
      },
      {
        question: "Can I suggest a source to track?",
        answer:
          "Absolutely. We are always expanding our source network. Email us at hello@confirmd.io with the source name, URL or handle, and why you think it should be tracked. Our editorial team evaluates every suggestion.",
      },
      {
        question: "What is the Signals page?",
        answer: (
          <span>
            The{" "}
            <a
              href="/signals"
              className="text-cyan-600 font-bold hover:underline"
            >
              Signals page
            </a>{" "}
            aggregates claims by asset and shows emerging trends -- which tokens
            are generating the most verified activity, which are surrounded by
            speculation, and where the narrative momentum is shifting.
          </span>
        ),
      },
      {
        question: "Do you cover all cryptocurrencies?",
        answer:
          "We focus on the top 200 assets by market cap, plus any token that enters our pipeline through monitored sources. If a lesser-known token generates significant claim activity, it will appear in our system. We are continuously expanding coverage.",
      },
    ],
  },
  {
    name: "Subscriptions",
    items: [
      {
        question: "What is the difference between free and Plus?",
        answer: (
          <span>
            The free Scholar tier gives you access to the main feed, basic
            verdict labels, and a 3-item watchlist. The Tribune tier ($9.99/mo)
            unlocks full evidence ladders, 25 watchlist items, real-time alerts,
            and source history. The Oracle tier ($29.99/mo) adds API access,
            data export, 100 watchlist items, custom alerts, and early access to
            new features. Full comparison on the{" "}
            <a href="/plus" className="text-cyan-600 font-bold hover:underline">
              Plus page
            </a>
            .
          </span>
        ),
      },
      {
        question: "Can I cancel my subscription at any time?",
        answer:
          "Yes. All subscriptions are month-to-month with no long-term commitment. You can cancel from your account settings at any time, and you will retain access through the end of your billing period.",
      },
      {
        question: "Do you offer annual pricing?",
        answer:
          "Annual plans are coming soon and will offer a significant discount compared to monthly billing. Join the waitlist on the Plus page to be notified when annual pricing launches.",
      },
    ],
  },
  {
    name: "Account & Technical",
    items: [
      {
        question: "How do I create an account?",
        answer:
          "Click the 'Create Account' button in the top-right corner of any page. You can sign up with an email address. Account creation is free and gives you immediate access to the Scholar tier.",
      },
      {
        question: "Is my data safe?",
        answer: (
          <span>
            Yes. We follow industry-standard security practices and never sell
            your personal data. Read our full{" "}
            <a
              href="/privacy"
              className="text-cyan-600 font-bold hover:underline"
            >
              Privacy Policy
            </a>{" "}
            for details on data collection, usage, and your rights.
          </span>
        ),
      },
      {
        question: "What browsers are supported?",
        answer:
          "Confirmd works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version for the best experience. Mobile browsers are fully supported.",
      },
      {
        question: "I found a bug or inaccuracy. How do I report it?",
        answer:
          "Email us at hello@confirmd.io with a description of the issue. For claim inaccuracies, include the claim URL and what you believe is incorrect. We take accuracy reports extremely seriously and will investigate within 24 hours.",
      },
    ],
  },
];

const FaqPage: React.FC = () => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="relative z-10 animate-in">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block px-5 py-2 bg-cyan-50 border border-cyan-100 rounded-full mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600">
              Support
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9] mb-6">
            Frequently Asked<br />
            <span className="text-cyan-600">Questions</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">
            Everything you need to know about Confirmd, our verification
            system, and how to get the most out of the platform.
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="max-w-4xl mx-auto px-6 md:px-12 pb-32">
        <div className="space-y-16">
          {faqData.map((category) => (
            <div key={category.name}>
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                  <span className="text-[10px] font-black text-white uppercase">
                    {category.name.charAt(0)}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  {category.name}
                </h2>
              </div>

              <div className="space-y-3">
                {category.items.map((item, idx) => {
                  const key = `${category.name}-${idx}`;
                  const isOpen = openItems[key] ?? false;

                  return (
                    <div
                      key={key}
                      className={`glass rounded-[1.5rem] border transition-all duration-500 ${
                        isOpen
                          ? "border-cyan-200 shadow-lg"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center justify-between p-6 md:p-8 text-left"
                      >
                        <span className="text-base font-bold text-slate-900 pr-8">
                          {item.question}
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
                          {item.answer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-20 glass rounded-[2.5rem] p-10 md:p-14 border border-slate-100 shadow-xl text-center">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3 uppercase">
            Still Have Questions?
          </h3>
          <p className="text-slate-500 font-medium mb-8">
            Our team is here to help. Reach out and we will get back to you
            within 24 hours.
          </p>
          <a
            href="mailto:hello@confirmd.io"
            className="inline-block bg-slate-900 text-white text-[11px] font-black px-10 py-4 rounded-xl hover:bg-cyan-600 transition-all shadow-xl uppercase tracking-[0.2em]"
          >
            hello@confirmd.io
          </a>
        </div>
      </section>
    </div>
  );
};

export default FaqPage;
