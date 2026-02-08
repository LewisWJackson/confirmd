import React from "react";

const CareersPage: React.FC = () => {
  return (
    <div className="relative z-10 animate-in">
      {/* Hero */}
      <section className="bg-surface-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-20">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-black text-content-primary tracking-tighter leading-[0.9] mb-6">
              Help us shape the future of media and empower free thinking.
            </h1>
            <p className="text-lg text-content-secondary font-medium leading-relaxed mb-8">
              We are looking for talented people who want to make a significant
              impact in how the world consumes and verifies crypto news.
            </p>
            <a
              href="#positions"
              className="inline-block bg-accent text-accent-text text-sm font-black px-8 py-4 rounded-xl hover:bg-accent-hover transition-all uppercase tracking-wider"
            >
              View Open Positions
            </a>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-surface-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
          <h2 className="text-3xl md:text-4xl font-black text-content-primary tracking-tighter mb-4">
            Our Core Values
          </h2>
          <p className="text-content-secondary font-medium leading-relaxed max-w-3xl mb-12">
            Every person who joins Confirmd brings something unique to our mission.
            What unites us is a shared set of values -- a commitment to think freely about
            the problems we are solving.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Transparency",
                desc: "We show our work. Every verdict, methodology, and process is open for scrutiny.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ),
              },
              {
                title: "Curiosity",
                desc: "We question everything. Good journalism and good engineering both start with asking why.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                title: "Independence",
                desc: "We take no positions, hold no tokens we cover, and accept no payment for verdicts.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                ),
              },
              {
                title: "Impact",
                desc: "We measure success by how many people we help make better-informed decisions.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
              },
            ].map((value) => (
              <div
                key={value.title}
                className="bg-surface-card rounded-2xl border border-border p-8 hover:bg-surface-card-hover transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent mb-6">
                  {value.icon}
                </div>
                <h3 className="text-lg font-black text-content-primary tracking-tight mb-3">
                  {value.title}
                </h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="bg-surface-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black text-content-primary tracking-tighter mb-6">
              Our Mission
            </h2>
            <p className="text-xl text-content-secondary font-medium leading-relaxed">
              We are on a mission to make the crypto news ecosystem transparent,
              accountable, and trustworthy. Every person on our team plays a
              direct role in achieving that goal.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-surface-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
          <h2 className="text-3xl md:text-4xl font-black text-content-primary tracking-tighter mb-12 text-center">
            Benefits
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Remote Work",
                desc: "Work from anywhere in the world. We are a fully distributed team across multiple time zones.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                ),
              },
              {
                title: "Competitive Pay",
                desc: "Market-rate compensation benchmarked against top tech companies, reviewed annually.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                title: "Equity",
                desc: "Every team member receives meaningful equity so you benefit directly from our success.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
              },
              {
                title: "Health & Wellness",
                desc: "Comprehensive health insurance, mental health support, and wellness stipend for the whole team.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
              },
            ].map((benefit) => (
              <div
                key={benefit.title}
                className="bg-surface-card rounded-2xl border border-border p-8 text-center hover:bg-surface-card-hover transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent mb-4 mx-auto">
                  {benefit.icon}
                </div>
                <h3 className="text-base font-black text-content-primary tracking-tight mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hiring Process */}
      <section className="bg-surface-primary border-b border-border">
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-20">
          <h2 className="text-3xl md:text-4xl font-black text-content-primary tracking-tighter mb-4">
            Hiring Process at Confirmd
          </h2>
          <p className="text-content-secondary font-medium leading-relaxed mb-12">
            Just like we empower readers to see through crypto media bias, we take a deliberate,
            transparent approach to hiring. We want to find you at your best.
          </p>

          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Application Review",
                desc: "Submit your application and we will review it within 5 business days. We read every application personally -- no AI screening.",
              },
              {
                step: "2",
                title: "Initial Conversation",
                desc: "A 30-minute video call with a team member to learn about you, your interests, and answer any questions you have about Confirmd.",
              },
              {
                step: "3",
                title: "Technical Assessment",
                desc: "A take-home project relevant to the role, designed to be completed in 2-4 hours. We compensate candidates for their time.",
              },
              {
                step: "4",
                title: "Team Interview",
                desc: "Meet the team you will be working with. A collaborative session to discuss your project and explore how we would work together.",
              },
              {
                step: "5",
                title: "Offer",
                desc: "We aim to extend offers within 48 hours of the final interview. We are transparent about compensation from the start.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-surface-card rounded-2xl border border-border p-6 hover:bg-surface-card-hover transition-colors"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-black text-accent-text">
                      {item.step}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-content-primary tracking-tight mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-content-secondary leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="bg-surface-secondary border-b border-border">
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-20">
          <h2 className="text-3xl md:text-4xl font-black text-content-primary tracking-tighter mb-12 text-center">
            Be part of our mission
          </h2>

          <div className="bg-surface-card rounded-2xl border border-border p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-primary border border-border flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-content-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-content-primary tracking-tight mb-3">
              No open positions at the moment
            </h3>
            <p className="text-content-secondary font-medium max-w-md mx-auto mb-6">
              We do not have any open positions right now, but we are always
              looking for exceptional people. Check back soon or send us your
              resume.
            </p>
            <a
              href="mailto:careers@confirmd.io"
              className="inline-block bg-accent text-accent-text text-sm font-black px-8 py-4 rounded-xl hover:bg-accent-hover transition-all uppercase tracking-wider"
            >
              Send Your Resume
            </a>
          </div>
        </div>
      </section>

      {/* Think Freely CTA */}
      <section className="bg-surface-primary">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-content-primary tracking-tighter">
            Think Freely.
          </h2>
        </div>
      </section>
    </div>
  );
};

export default CareersPage;
