import React, { useState } from "react";

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

const faqItems: FaqItem[] = [
  {
    question: "Does Confirmd present any original news?",
    answer:
      "No. Confirmd aggregates and verifies claims from existing crypto news sources. We do not produce original reporting. Our value is in the verification layer -- analyzing, cross-referencing, and grading the claims made by other outlets.",
  },
  {
    question: "How does Confirmd decide what news stories to show me?",
    answer:
      "Our ingestion pipeline monitors 150+ crypto publishers, X accounts, Telegram channels, and regulatory filings in real time. Stories are ranked by claim density, verification status, and relevance. We do not use engagement-based algorithms -- the goal is to surface truth, not clicks.",
  },
  {
    question: "How can I see news that is relevant to my country?",
    answer:
      "You can filter stories by region in the main feed. We also tag stories with the jurisdictions they affect, so you can quickly find regulatory developments, exchange news, and market events relevant to your location.",
  },
  {
    question: "Where does the news on Confirmd come from?",
    answer: (
      <span>
        We monitor 150+ sources including major crypto outlets (CoinDesk,
        The Block, Decrypt), traditional financial media (Bloomberg, Reuters),
        social platforms (X, Telegram), official regulatory filings (SEC,
        CFTC), and on-chain data. Visit our{" "}
        <a href="/sources" className="text-accent font-bold hover:underline">
          Sources page
        </a>{" "}
        to see the full list.
      </span>
    ),
  },
  {
    question: "How does the rating system on Confirmd work?",
    answer: (
      <span>
        We use a 4-tier verdict system:{" "}
        <strong className="text-factuality-high">Verified</strong> (strong
        primary-source evidence),{" "}
        <strong className="text-content-secondary">Plausible</strong> (some
        supporting evidence),{" "}
        <strong className="text-factuality-mixed">Speculative</strong> (little
        to no evidence), and{" "}
        <strong className="text-factuality-low">Misleading</strong> (evidence
        contradicts the claim). Each claim also receives an evidence grade
        (A-D) reflecting source reliability. Read our full{" "}
        <a href="/methodology" className="text-accent font-bold hover:underline">
          Methodology
        </a>{" "}
        for details.
      </span>
    ),
  },
  {
    question: "What are the factuality ratings (High, Mixed, Low)?",
    answer:
      "Factuality ratings summarize overall source reliability. High (80-100%) means strong, cross-referenced evidence. Mixed (40-79%) means partial evidence or conflicting sources. Low (0-39%) means little evidence or active contradictions. These ratings are calculated using our weighted formula that considers evidence strength, source track record, cross-reference density, and recency.",
  },
  {
    question: "Does Confirmd have a political agenda?",
    answer:
      "No. Confirmd is strictly non-partisan and non-promotional. We do not take positions on any token, protocol, or market direction. We do not hold tokens that we cover, and we accept no payment for verdicts. Our only agenda is verification.",
  },
  {
    question: "How can I see fewer ads?",
    answer: (
      <span>
        Confirmd+ subscribers enjoy an
        ad-free experience. Visit our{" "}
        <a href="/plus" className="text-accent font-bold hover:underline">
          Plus page
        </a>{" "}
        to learn more about subscription benefits.
      </span>
    ),
  },
  {
    question: "I have a suggestion. How do I give it to you?",
    answer: (
      <span>
        We love feedback! Email us at{" "}
        <a href="mailto:hello@confirmd.io" className="text-accent font-bold hover:underline">
          hello@confirmd.io
        </a>{" "}
        or visit our{" "}
        <a href="/contact" className="text-accent font-bold hover:underline">
          Contact page
        </a>
        . We read every message and regularly ship features suggested by
        our community.
      </span>
    ),
  },
  {
    question: "Want to know more about Confirmd?",
    answer: (
      <span>
        Visit our{" "}
        <a href="/about" className="text-accent font-bold hover:underline">
          About page
        </a>{" "}
        for the full story, or check out our{" "}
        <a href="/methodology" className="text-accent font-bold hover:underline">
          Methodology
        </a>{" "}
        to understand how we verify claims.
      </span>
    ),
  },
  {
    question: "How do I subscribe?",
    answer: (
      <span>
        Confirmd subscriptions are available through our website. Visit the{" "}
        <a href="/plus" className="text-accent font-bold hover:underline">
          Confirmd+
        </a>{" "}
        page to compare plans and start a free trial. We accept all major
        credit cards via Stripe.
      </span>
    ),
  },
  {
    question: "Why am I not getting password reset emails?",
    answer:
      "Check your spam or junk folder first. If the email is not there, make sure you are using the same email address you registered with. Password reset emails are sent immediately but may take up to 5 minutes to arrive. If you still have issues, contact us at hello@confirmd.io.",
  },
];

const FaqPage: React.FC = () => {
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({});

  const toggleItem = (idx: number) => {
    setOpenItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="relative z-10 animate-in">
      {/* Hero */}
      <section className="bg-surface-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-16">
          <h1 className="text-7xl md:text-9xl font-black text-content-primary tracking-tighter leading-[0.85] mb-6">
            FAQ
          </h1>
          <p className="text-lg text-content-secondary font-medium leading-relaxed max-w-xl">
            Here are some common questions asked about Confirmd
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="bg-surface-secondary border-b border-border">
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
          <div className="divide-y divide-border">
            {faqItems.map((item, idx) => {
              const isOpen = openItems[idx] ?? false;

              return (
                <div key={idx}>
                  <button
                    onClick={() => toggleItem(idx)}
                    className="w-full flex items-center justify-between py-6 text-left group"
                  >
                    <span className="text-base font-bold text-content-primary pr-8 group-hover:text-accent transition-colors">
                      {item.question}
                    </span>
                    <div className="flex-shrink-0">
                      <svg
                        className={`w-5 h-5 text-content-muted transition-transform duration-300 ${
                          isOpen ? "rotate-45" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? "max-h-96 opacity-100 pb-6" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="text-sm text-content-secondary font-medium leading-relaxed pr-12">
                      {item.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Want to know more */}
      <section className="bg-surface-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-content-primary tracking-tighter leading-tight">
                Want to know more about Confirmd?
              </h2>
            </div>
            <div>
              <h3 className="text-sm font-black text-content-muted uppercase tracking-widest mb-6">
                Check out the following pages:
              </h3>
              <div className="space-y-3">
                <a
                  href="/methodology"
                  className="block text-accent font-bold hover:underline text-lg"
                >
                  The Methodology of Confirmd
                </a>
                <a
                  href="/about"
                  className="block text-accent font-bold hover:underline text-lg"
                >
                  About Confirmd
                </a>
                <a
                  href="/plus"
                  className="block text-accent font-bold hover:underline text-lg"
                >
                  Confirmd+ Subscriptions
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe CTA */}
      <section className="bg-accent">
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-accent-text tracking-tighter mb-4">
            How do I subscribe?
          </h2>
          <p className="text-accent-text/80 font-medium max-w-lg mx-auto mb-8">
            Confirmd+ subscriptions are purchased through our website.
            Start with a free trial and upgrade anytime.
          </p>
          <a
            href="/plus"
            className="inline-block bg-surface-primary text-content-primary text-sm font-black px-10 py-4 rounded-xl hover:bg-surface-secondary transition-all uppercase tracking-wider"
          >
            Subscribe Now
          </a>
          <p className="text-xs text-accent-text/60 mt-6 max-w-md mx-auto">
            For more information about features available from Confirmd, or for
            information on how to cancel or manage your subscription, please see
            our{" "}
            <a href="/plus" className="underline hover:text-accent-text/80">
              Subscriptions
            </a>{" "}
            page.
          </p>
        </div>
      </section>
    </div>
  );
};

export default FaqPage;
