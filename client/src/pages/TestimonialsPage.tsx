import React from "react";
import { useLocation } from "wouter";

const testimonials = [
  {
    quote:
      "I used to spend hours cross-referencing claims from crypto Twitter. Confirmd does it in seconds with transparent methodology. It has completely changed how I evaluate information before making investment decisions.",
    name: "Ethan Johnson",
    title: "Independent Crypto Analyst",
  },
  {
    quote:
      "As a portfolio manager, I need to separate signal from noise quickly. Confirmd's evidence ladders give me the confidence to act on verified information rather than speculation. The source credibility scores alone are worth the subscription.",
    name: "Rachel Kim",
    title: "Digital Asset Portfolio Manager, Apex Capital",
  },
  {
    quote:
      "I've tried every fact-checking tool out there for crypto. None of them come close to Confirmd's depth of analysis. The Bayesian methodology means the scores actually mean something, unlike subjective ratings elsewhere.",
    name: "Marcus Chen",
    title: "DeFi Researcher & Newsletter Author",
  },
  {
    quote:
      "Confirmd has made following the news more approachable, informative, and engaging. I used to be comfortable in my bubble, only reading sources that I trusted. It all honesty, I never realized how overwhelming and intimidating it can be to navigate crypto news. Confirmd changed that for me.",
    name: "Sarah Blair",
    title: "Chairwoman of the West Virginia Forum of Exchanges",
  },
  {
    quote:
      "The real-time alerts for claims related to my portfolio have saved me from panic-selling on false rumors at least three times. That alone has paid for a lifetime of subscriptions.",
    name: "Alex Petrov",
    title: "Quantitative Trader",
  },
  {
    quote:
      "What sets Confirmd apart is the transparency. Every verdict shows its evidence chain, every source has a track record. No black boxes, no hidden editorial biases. Just data-driven verification.",
    name: "Priya Sharma",
    title: "Blockchain Security Auditor, ChainShield",
  },
  {
    quote:
      "I run a crypto education platform with 50,000 students. Before citing any claim in my courses, I verify it through Confirmd. It's become the standard for responsible crypto education.",
    name: "Daniel Okafor",
    title: "Founder, CryptoLiteracy Academy",
  },
  {
    quote:
      "As a journalist, I was skeptical of automated verification tools. But Confirmd's methodology is more rigorous than most newsrooms. I now use it as my primary source verification layer before publishing.",
    name: "Emma Rodriguez",
    title: "Senior Crypto Correspondent, Digital Wire",
  },
  {
    quote:
      "The source credibility directory is invaluable. Being able to see how accurate a source has been historically, with real data behind it, completely changes how you consume information in this space.",
    name: "James Wright",
    title: "Venture Capital Associate, Ledger Ventures",
  },
  {
    quote:
      "Our compliance team requires verified information before any public statements about digital assets. Confirmd gives us the audit trail we need. The Oracle tier's data export feature is exactly what institutional users require.",
    name: "Lisa Nakamura",
    title: "Chief Compliance Officer, Pacific Digital Trust",
  },
];

const TestimonialsPage: React.FC = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-5xl font-bold text-content-primary tracking-tight leading-tight mb-4">
                Confirmd delivers what other platforms don't.
              </h1>
              <ul className="space-y-2 text-content-secondary text-sm">
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Unmatched claim verification</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Transparent evidence methodology</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Dependable source credibility scores</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Evidence behind every verdict</span>
                </li>
              </ul>
            </div>

            <div className="bg-surface-card border border-border rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-accent">10,000+</div>
              <div className="text-sm text-content-secondary mt-1">5-star reviews</div>
              <div className="flex items-center justify-center mt-2 space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              {/* App store badges placeholder */}
              <div className="flex items-center justify-center space-x-3 mt-4">
                <div className="bg-surface-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-content-muted">
                  App Store
                </div>
                <div className="bg-surface-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-content-muted">
                  Google Play
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unmatched bias visibility */}
      <section className="bg-surface-secondary py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="text-2xl md:text-3xl font-bold text-content-primary mb-4">
            Unmatched verification visibility
          </h2>
          <p className="text-content-secondary max-w-3xl mb-8">
            See exactly how claims are verified, which sources contributed evidence,
            and how confidence scores are calculated. No black boxes.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="space-y-12">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                } gap-8 items-start`}
              >
                {/* Image placeholder */}
                <div className="w-full md:w-1/3 flex-shrink-0">
                  <div className="bg-surface-card border border-border rounded-xl h-48 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-surface-secondary border border-border flex items-center justify-center">
                      <span className="text-lg font-bold text-content-muted">
                        {t.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quote */}
                <div className="flex-1">
                  <svg className="w-8 h-8 text-accent opacity-30 mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <blockquote className="text-content-primary leading-relaxed mb-4">
                    {t.quote}
                  </blockquote>
                  <div>
                    <div className="font-bold text-content-primary text-sm">{t.name}</div>
                    <div className="text-content-muted text-xs">{t.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* There's no other source like it */}
      <section className="bg-surface-secondary py-16">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-content-primary mb-4">
            There's no other news source like it.
          </h2>
          <p className="text-content-secondary max-w-2xl mx-auto mb-8">
            Confirmd gives you the tools to verify claims, evaluate sources, and make
            informed decisions. Join the growing community of researchers, analysts, and
            informed participants who trust Confirmd.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="bg-surface-card border border-border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-accent">+1 Million</div>
              <div className="text-xs text-content-muted mt-1">Claims verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* Get the news your way CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-content-primary mb-4">
            Get the news your way.
          </h2>
          <p className="text-content-secondary max-w-xl mx-auto mb-8">
            Start verifying claims, evaluating sources, and building informed opinions today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setLocation("/signup")}
              className="bg-accent text-accent-text px-8 py-3 rounded-lg text-sm font-bold hover:bg-accent-hover transition-all"
            >
              Get Started Free
            </button>
            <button
              onClick={() => setLocation("/plus")}
              className="border border-border text-content-primary px-8 py-3 rounded-lg text-sm font-bold hover:bg-surface-card transition-all"
            >
              View Plans
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TestimonialsPage;
