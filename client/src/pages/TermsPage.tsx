import React from "react";

const TermsPage: React.FC = () => {
  const lastUpdated = "February 1, 2026";

  const sections = [
    {
      number: "1",
      title: "Acceptance of Terms",
      content: (
        <div className="space-y-4">
          <p>
            By accessing or using the Confirmd platform ("Service"), you agree
            to be bound by these Terms and Conditions ("Terms"). If you do not
            agree to these Terms, do not use the Service.
          </p>
          <p>
            These Terms apply to all visitors, users, and others who access
            or use the Service. By using the Service, you represent that you
            are at least 18 years of age or that you are the parent or
            guardian of a minor user and consent to the minor's use of the
            Service.
          </p>
          <p>
            We reserve the right to update or modify these Terms at any time
            without prior notice. Your continued use of the Service following
            the posting of any changes to the Terms constitutes acceptance
            of those changes.
          </p>
        </div>
      ),
    },
    {
      number: "2",
      title: "Account Terms",
      content: (
        <div className="space-y-4">
          <p>
            To access certain features of the Service, you must create an
            account. When you create an account, you agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              Provide accurate, current, and complete information during the
              registration process.
            </li>
            <li>
              Maintain and promptly update your account information to keep
              it accurate, current, and complete.
            </li>
            <li>
              Maintain the security of your account by not sharing your
              password with others and restricting access to your account.
            </li>
            <li>
              Notify us immediately of any unauthorized use of your account
              or any other breach of security.
            </li>
            <li>
              Accept responsibility for all activities that occur under your
              account.
            </li>
          </ul>
          <p>
            We reserve the right to suspend or terminate your account at any
            time for any reason, including violation of these Terms, at our
            sole discretion.
          </p>
        </div>
      ),
    },
    {
      number: "3",
      title: "Subscription Terms",
      content: (
        <div className="space-y-4">
          <p>
            Confirmd offers free and paid subscription tiers. By subscribing
            to a paid tier (Tribune or Oracle), you agree to the following:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Billing:</strong> Subscription fees are billed monthly
              in advance. You authorize us to charge your payment method on
              a recurring basis.
            </li>
            <li>
              <strong>Free Trials:</strong> If you sign up for a free trial,
              you will be charged at the end of the trial period unless you
              cancel before it expires.
            </li>
            <li>
              <strong>Cancellation:</strong> You may cancel your subscription
              at any time through your account settings. Cancellations take
              effect at the end of the current billing period.
            </li>
            <li>
              <strong>Refunds:</strong> Subscription fees are non-refundable,
              except where required by applicable law. Partial-month refunds
              are not available.
            </li>
            <li>
              <strong>Price Changes:</strong> We may change subscription
              prices upon 30 days' notice. Price changes take effect at the
              start of your next billing period.
            </li>
          </ul>
        </div>
      ),
    },
    {
      number: "4",
      title: "Acceptable Use",
      content: (
        <div className="space-y-4">
          <p>
            You agree not to use the Service to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              Violate any applicable law, regulation, or these Terms.
            </li>
            <li>
              Infringe the intellectual property or privacy rights of others.
            </li>
            <li>
              Transmit any malicious code, viruses, or other harmful material.
            </li>
            <li>
              Attempt to gain unauthorized access to any part of the Service,
              other accounts, or computer systems.
            </li>
            <li>
              Use any automated means (bots, scrapers, crawlers) to access
              the Service without our express written permission.
            </li>
            <li>
              Resell, redistribute, or commercially exploit any part of the
              Service without authorization.
            </li>
            <li>
              Interfere with or disrupt the integrity or performance of the
              Service.
            </li>
          </ul>
        </div>
      ),
    },
    {
      number: "5",
      title: "Intellectual Property",
      content: (
        <div className="space-y-4">
          <p>
            The Service and its original content, features, and functionality
            are owned by Confirmd Data Systems and are protected by
            international copyright, trademark, patent, trade secret, and
            other intellectual property laws.
          </p>
          <p>
            Our trademarks, trade names, and trade dress may not be used in
            connection with any product or service without the prior written
            consent of Confirmd Data Systems.
          </p>
          <p>
            Verification verdicts, factuality scores, evidence grades, and
            other analytical outputs generated by the Service are proprietary
            to Confirmd. You may reference or cite them with proper
            attribution but may not reproduce them in bulk or use them to
            create a competing service.
          </p>
        </div>
      ),
    },
    {
      number: "6",
      title: "Disclaimer of Warranties",
      content: (
        <div className="space-y-4">
          <p>
            THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS.
            CONFIRMD DATA SYSTEMS MAKES NO WARRANTIES, EXPRESSED OR IMPLIED,
            AND HEREBY DISCLAIMS ALL WARRANTIES INCLUDING, WITHOUT
            LIMITATION, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p>
            Confirmd does not warrant that the Service will be uninterrupted,
            secure, or error-free, that defects will be corrected, or that
            the Service is free of viruses or other harmful components.
          </p>
          <p>
            Verification verdicts and factuality scores are provided for
            informational purposes only and should not be construed as
            financial, investment, legal, or professional advice. You should
            not rely solely on Confirmd's analysis when making financial or
            investment decisions.
          </p>
        </div>
      ),
    },
    {
      number: "7",
      title: "Limitation of Liability",
      content: (
        <div className="space-y-4">
          <p>
            IN NO EVENT SHALL CONFIRMD DATA SYSTEMS, ITS DIRECTORS,
            EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES, BE LIABLE
            FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
            DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA,
            USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Your access to or use of, or inability to access or use, the Service.</li>
            <li>Any conduct or content of any third party on the Service.</li>
            <li>Any content obtained from the Service.</li>
            <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
          </ul>
          <p>
            Our total liability for any claims arising under these Terms
            shall not exceed the amount you paid us in the twelve (12)
            months preceding the claim.
          </p>
        </div>
      ),
    },
    {
      number: "8",
      title: "API and Data Access",
      content: (
        <div className="space-y-4">
          <p>
            If you subscribe to a tier that includes API access, you agree
            to the following additional terms:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              API access is for your personal or internal business use only
              unless otherwise agreed in writing.
            </li>
            <li>
              You will not exceed the rate limits specified for your
              subscription tier.
            </li>
            <li>
              You will not use the API to build a service that competes with
              Confirmd.
            </li>
            <li>
              We reserve the right to modify or discontinue API access at
              any time with reasonable notice.
            </li>
          </ul>
        </div>
      ),
    },
    {
      number: "9",
      title: "Governing Law",
      content: (
        <p>
          These Terms shall be governed and construed in accordance with the
          laws of the State of Delaware, United States, without regard to
          its conflict of law provisions. Our failure to enforce any right
          or provision of these Terms will not be considered a waiver of
          those rights. If any provision of these Terms is held to be
          invalid or unenforceable by a court, the remaining provisions of
          these Terms will remain in effect.
        </p>
      ),
    },
    {
      number: "10",
      title: "Changes to Terms",
      content: (
        <div className="space-y-4">
          <p>
            We reserve the right, at our sole discretion, to modify or
            replace these Terms at any time. If a revision is material, we
            will try to provide at least 30 days' notice prior to any new
            terms taking effect. What constitutes a material change will be
            determined at our sole discretion.
          </p>
          <p>
            By continuing to access or use our Service after those revisions
            become effective, you agree to be bound by the revised Terms.
            If you do not agree to the new Terms, please stop using the
            Service.
          </p>
        </div>
      ),
    },
    {
      number: "11",
      title: "Contact Us",
      content: (
        <div className="space-y-4">
          <p>
            If you have any questions about these Terms, please contact us:
          </p>
          <div className="bg-surface-primary rounded-xl border border-border p-5 space-y-2">
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:legal@confirmd.io" className="text-accent font-bold hover:underline">
                legal@confirmd.io
              </a>
            </p>
            <p>
              <strong>General Inquiries:</strong>{" "}
              <a href="mailto:hello@confirmd.io" className="text-accent font-bold hover:underline">
                hello@confirmd.io
              </a>
            </p>
            <p>
              <strong>Company:</strong> Confirmd Data Systems
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="relative z-10 animate-in">
      {/* Hero */}
      <section className="bg-surface-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-12">
          <h1 className="text-5xl md:text-7xl font-black text-content-primary tracking-tighter leading-[0.9] mb-4">
            Terms and Conditions
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
              {/* Intro */}
              <p className="text-content-secondary font-medium leading-relaxed">
                Please read these Terms and Conditions carefully before using
                the Confirmd platform operated by Confirmd Data Systems
                ("Confirmd," "we," "us," or "our"). Your access to and use of
                the Service is conditioned on your acceptance of and compliance
                with these Terms.
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
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsPage;
