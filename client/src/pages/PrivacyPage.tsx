import React from "react";

const PrivacyPage: React.FC = () => {
  const lastUpdated = "February 1, 2026";

  const sections = [
    {
      number: "1",
      title: "Information We Collect",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-black text-content-primary uppercase tracking-wider mb-3">
              Information You Provide
            </h3>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Account Information:</strong> When you create an
                account, we collect your email address, display name, and
                password (stored in hashed form).
              </li>
              <li>
                <strong>Subscription Data:</strong> If you subscribe to a
                paid tier, payment processing is handled by Stripe. We do
                not store your full credit card number. We receive and store
                a tokenized reference, billing address, and transaction
                history.
              </li>
              <li>
                <strong>Watchlist & Preferences:</strong> Assets, claims,
                and sources you choose to follow or customize.
              </li>
              <li>
                <strong>Communications:</strong> Messages you send us via
                email or support channels.
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-black text-content-primary uppercase tracking-wider mb-3">
              Information Collected Automatically
            </h3>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Usage Data:</strong> Pages visited, features used,
                search queries, and interaction patterns.
              </li>
              <li>
                <strong>Device Information:</strong> Browser type, operating
                system, device identifiers, and screen resolution.
              </li>
              <li>
                <strong>Log Data:</strong> IP address, access times, and
                referring URLs.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      number: "2",
      title: "How We Use Your Information",
      content: (
        <div className="space-y-3">
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Provide, maintain, and improve the Service.</li>
            <li>Process subscriptions and manage your account.</li>
            <li>
              Personalize your experience, including your feed and watchlist.
            </li>
            <li>
              Send transactional communications (account confirmations,
              billing receipts, security alerts).
            </li>
            <li>
              Send product updates and feature announcements (you can opt
              out at any time).
            </li>
            <li>
              Analyze usage patterns to improve platform performance and
              reliability.
            </li>
            <li>
              Detect and prevent fraud, abuse, or security incidents.
            </li>
            <li>
              Comply with legal obligations and enforce our terms of service.
            </li>
          </ul>
        </div>
      ),
    },
    {
      number: "3",
      title: "Third-Party Sharing",
      content: (
        <div className="space-y-4">
          <p>
            We do not sell your personal information. We may share information
            with third parties only in the following circumstances:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Service Providers:</strong> We work with trusted third
              parties who assist in operating the Service (e.g., Stripe for
              payments, cloud hosting providers, analytics tools). These
              providers are contractually bound to protect your data.
            </li>
            <li>
              <strong>Legal Requirements:</strong> We may disclose
              information if required by law, subpoena, or court order, or
              if we believe disclosure is necessary to protect our rights,
              your safety, or the safety of others.
            </li>
            <li>
              <strong>Business Transfers:</strong> In the event of a merger,
              acquisition, or sale of assets, user data may be transferred.
              You will be notified of any such change.
            </li>
            <li>
              <strong>With Your Consent:</strong> We may share information
              for any other purpose with your explicit consent.
            </li>
          </ul>
        </div>
      ),
    },
    {
      number: "4",
      title: "Your Rights",
      content: (
        <div className="space-y-6">
          <p>
            Depending on your jurisdiction, you may have the following rights
            regarding your personal data:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                right: "Access",
                desc: "Request a copy of the personal data we hold about you.",
              },
              {
                right: "Rectification",
                desc: "Request correction of inaccurate or incomplete data.",
              },
              {
                right: "Erasure",
                desc: "Request deletion of your personal data (right to be forgotten).",
              },
              {
                right: "Portability",
                desc: "Request your data in a structured, machine-readable format.",
              },
              {
                right: "Objection",
                desc: "Object to processing of your data for certain purposes.",
              },
              {
                right: "Withdraw Consent",
                desc: "Withdraw previously given consent at any time.",
              },
            ].map((item) => (
              <div
                key={item.right}
                className="bg-surface-primary rounded-xl border border-border p-5"
              >
                <div className="text-xs font-black text-content-primary uppercase tracking-wider mb-1">
                  {item.right}
                </div>
                <p className="text-sm text-content-muted">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <p>
              <strong>GDPR (EU/EEA):</strong> If you are located in the
              European Economic Area, you have the above rights under the
              General Data Protection Regulation. Our legal basis for
              processing is consent and legitimate interest.
            </p>
            <p>
              <strong>CCPA (California):</strong> California residents have
              the right to know what personal information is collected,
              request deletion, and opt out of the sale of personal
              information. We do not sell personal information.
            </p>
            <p>
              To exercise any of these rights, email us at{" "}
              <a
                href="mailto:privacy@confirmd.io"
                className="text-accent font-bold hover:underline"
              >
                privacy@confirmd.io
              </a>
              . We will respond within 30 days.
            </p>
          </div>
        </div>
      ),
    },
    {
      number: "5",
      title: "Cookie Policy",
      content: (
        <div className="space-y-4">
          <p>
            We use cookies and similar tracking technologies to operate and
            improve the Service. Cookies we use include:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Essential Cookies:</strong> Required for the Service to
              function (authentication, session management). Cannot be
              disabled.
            </li>
            <li>
              <strong>Analytics Cookies:</strong> Help us understand how
              users interact with the platform. You can opt out through your
              browser settings or our cookie preference center.
            </li>
            <li>
              <strong>Preference Cookies:</strong> Remember your settings,
              such as watchlist and display preferences.
            </li>
          </ul>
          <p>
            We do not use advertising or third-party tracking cookies. You
            can manage cookie preferences through your browser settings.
            Disabling essential cookies may impair Service functionality.
          </p>
        </div>
      ),
    },
    {
      number: "6",
      title: "Data Security & Retention",
      content: (
        <div className="space-y-3">
          <p>
            We implement industry-standard security measures including
            encryption in transit (TLS), encryption at rest, and access
            controls. While no method of transmission over the Internet is
            100% secure, we strive to protect your personal information.
          </p>
          <p>
            We retain personal data for as long as your account is active or
            as needed to provide the Service. If you delete your account, we
            will remove your personal data within 30 days, except where
            retention is required by law.
          </p>
        </div>
      ),
    },
    {
      number: "7",
      title: "Changes to This Policy",
      content: (
        <p>
          We may update this Privacy Policy from time to time. When we do,
          we will revise the "Last updated" date at the top of this page. For
          material changes, we will notify you via email or a prominent
          notice on the Service. Your continued use of the Service after
          changes constitutes acceptance of the updated policy.
        </p>
      ),
    },
  ];

  return (
    <div className="relative z-10 animate-in">
      {/* Hero */}
      <section className="bg-surface-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-12">
          <h1 className="text-5xl md:text-7xl font-black text-content-primary tracking-tighter leading-[0.9] mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-content-muted font-bold uppercase tracking-widest">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-surface-secondary">
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-16">
          <div className="bg-surface-card rounded-2xl border border-border overflow-hidden">
            <div className="p-8 md:p-12 space-y-12">
              {/* Introduction */}
              <p className="text-content-secondary font-medium leading-relaxed">
                Confirmd Data Systems ("Confirmd," "we," "us," or "our") is
                committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you use our platform at confirmd.io and
                related services (collectively, the "Service"). By using the
                Service, you agree to the practices described in this policy.
              </p>

              {/* Sections */}
              {sections.map((section) => (
                <div key={section.number}>
                  <div className="flex items-center space-x-4 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-accent-text">
                        {section.number}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-content-primary tracking-tight">
                      {section.title}
                    </h2>
                  </div>
                  <div className="text-sm text-content-secondary font-medium leading-relaxed ml-14">
                    {section.content}
                  </div>
                </div>
              ))}

              {/* Contact */}
              <div className="border-t border-border pt-10">
                <div className="flex items-center space-x-4 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-accent-text"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-black text-content-primary tracking-tight">
                    Contact for Privacy Inquiries
                  </h2>
                </div>
                <div className="text-sm text-content-secondary font-medium leading-relaxed ml-14 space-y-3">
                  <p>
                    If you have any questions about this Privacy Policy or
                    wish to exercise your data rights, please contact us:
                  </p>
                  <div className="bg-surface-primary rounded-xl border border-border p-5 space-y-2">
                    <p>
                      <strong>Email:</strong>{" "}
                      <a
                        href="mailto:privacy@confirmd.io"
                        className="text-accent font-bold hover:underline"
                      >
                        privacy@confirmd.io
                      </a>
                    </p>
                    <p>
                      <strong>General Inquiries:</strong>{" "}
                      <a
                        href="mailto:hello@confirmd.io"
                        className="text-accent font-bold hover:underline"
                      >
                        hello@confirmd.io
                      </a>
                    </p>
                    <p>
                      <strong>Company:</strong> Confirmd Data Systems
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage;
