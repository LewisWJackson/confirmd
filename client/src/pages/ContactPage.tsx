import React, { useState } from "react";

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: "", email: "", subject: "", message: "" });
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="relative z-10 animate-in">
      {/* Hero */}
      <section className="bg-surface-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-16">
          <h1 className="text-5xl md:text-7xl font-black text-content-primary tracking-tighter leading-[0.9] mb-6">
            Get in Touch
          </h1>
          <p className="text-lg text-content-secondary font-medium leading-relaxed max-w-2xl">
            Have a question, issue, or idea to share? We would love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-surface-card rounded-2xl border border-border p-8">
                {submitted && (
                  <div className="mb-6 bg-factuality-high/10 border border-factuality-high/30 rounded-xl px-5 py-3 flex items-center space-x-2 animate-in">
                    <svg className="w-5 h-5 text-factuality-high flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-bold text-factuality-high">
                      Message sent! We will get back to you soon.
                    </span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-content-muted uppercase tracking-widest block">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        required
                        className="w-full bg-surface-primary border border-border rounded-xl px-5 py-4 text-sm font-medium text-content-primary focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-all placeholder:text-content-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-content-muted uppercase tracking-widest block">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        required
                        className="w-full bg-surface-primary border border-border rounded-xl px-5 py-4 text-sm font-medium text-content-primary focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-all placeholder:text-content-muted"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-content-muted uppercase tracking-widest block">
                      Subject
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full bg-surface-primary border border-border rounded-xl px-5 py-4 text-sm font-medium text-content-primary focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-all"
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="bug">Bug Report</option>
                      <option value="inaccuracy">Report an Inaccuracy</option>
                      <option value="partnership">Partnership</option>
                      <option value="press">Press Inquiry</option>
                      <option value="subscription">Subscription Support</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-content-muted uppercase tracking-widest block">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us how we can help..."
                      required
                      rows={6}
                      className="w-full bg-surface-primary border border-border rounded-xl px-5 py-4 text-sm font-medium text-content-primary focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-all placeholder:text-content-muted resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-accent text-accent-text text-sm font-black px-10 py-4 rounded-xl hover:bg-accent-hover transition-all uppercase tracking-wider"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>

            {/* Side Info */}
            <div className="space-y-6">
              <div className="bg-surface-card rounded-2xl border border-border p-8">
                <h3 className="text-lg font-black text-content-primary tracking-tight mb-6">
                  Additional info
                </h3>

                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-black text-content-muted uppercase tracking-widest mb-2">
                      Company
                    </div>
                    <p className="text-sm text-content-secondary font-medium">
                      Confirmd Data Systems
                    </p>
                  </div>

                  <div>
                    <div className="text-xs font-black text-content-muted uppercase tracking-widest mb-2">
                      Email
                    </div>
                    <a
                      href="mailto:hello@confirmd.io"
                      className="text-sm text-accent font-bold hover:underline"
                    >
                      hello@confirmd.io
                    </a>
                  </div>

                  <div>
                    <div className="text-xs font-black text-content-muted uppercase tracking-widest mb-2">
                      Social
                    </div>
                    <a
                      href="https://x.com/confirmd"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent font-bold hover:underline"
                    >
                      @confirmd on X
                    </a>
                  </div>

                  <div>
                    <div className="text-xs font-black text-content-muted uppercase tracking-widest mb-2">
                      Response Time
                    </div>
                    <p className="text-sm text-content-secondary font-medium">
                      We aim to respond within 24 hours on business days.
                      For urgent issues, please include "URGENT" in your
                      subject line.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-card rounded-2xl border border-border p-8">
                <h3 className="text-base font-black text-content-primary tracking-tight mb-3">
                  Privacy Inquiries
                </h3>
                <p className="text-sm text-content-secondary leading-relaxed mb-3">
                  For data rights requests (access, deletion, export),
                  please email our privacy team directly.
                </p>
                <a
                  href="mailto:privacy@confirmd.io"
                  className="text-sm text-accent font-bold hover:underline"
                >
                  privacy@confirmd.io
                </a>
              </div>

              <div className="bg-surface-card rounded-2xl border border-border p-8">
                <h3 className="text-base font-black text-content-primary tracking-tight mb-3">
                  Report an Inaccuracy
                </h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  Found an error in one of our verdicts? We take accuracy
                  reports extremely seriously. Include the claim URL and
                  what you believe is incorrect, and we will investigate
                  within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
