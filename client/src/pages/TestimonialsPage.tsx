import React, { useState, useMemo } from "react";
import { useLocation } from "wouter";
import testimonials, { Testimonial } from "../data/testimonials";

type FilterCategory = "all" | "investor" | "researcher" | "developer";

const filterPills: { label: string; value: FilterCategory }[] = [
  { label: "All", value: "all" },
  { label: "Investors", value: "investor" },
  { label: "Researchers", value: "researcher" },
  { label: "Developers", value: "developer" },
];

const pressLogos = [
  "CoinDesk",
  "The Block",
  "Decrypt",
  "Blockworks",
  "Bitcoin Magazine",
];

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center space-x-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-accent" : "text-content-muted/30"}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ))}
  </div>
);

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial: t }) => (
  <div className="bg-surface-card border border-border rounded-xl p-6 flex flex-col break-inside-avoid mb-5">
    <StarRating rating={t.rating} />

    <blockquote className="text-sm text-content-primary leading-relaxed mt-4 mb-5 flex-1">
      "{t.quote}"
    </blockquote>

    <div className="flex items-center space-x-3 pt-4 border-t border-border/40">
      <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-accent">
          {t.name.charAt(0)}
        </span>
      </div>
      <div>
        <div className="font-semibold text-content-primary text-sm">{t.name}</div>
        <div className="text-content-muted text-xs">{t.role}</div>
      </div>
    </div>
  </div>
);

const TestimonialsPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");

  const filteredTestimonials = useMemo(() => {
    if (activeFilter === "all") return testimonials;
    return testimonials.filter((t) => t.category === activeFilter);
  }, [activeFilter]);

  // Split into columns for masonry layout
  const columns = useMemo(() => {
    const cols: [Testimonial[], Testimonial[], Testimonial[]] = [[], [], []];
    filteredTestimonials.forEach((t, i) => {
      cols[i % 3].push(t);
    });
    return cols;
  }, [filteredTestimonials]);

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Hero */}
      <section className="pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="max-w-6xl mx-auto px-6 md:px-12 text-center">
          {/* Star cluster */}
          <div className="flex items-center justify-center space-x-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg key={i} className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-content-primary tracking-tight mb-3">
            10,000+ 5-star reviews
          </h1>
          <p className="text-content-secondary text-lg max-w-2xl mx-auto">
            See why investors, researchers, and developers trust Confirmd to cut through the noise.
          </p>
        </div>
      </section>

      {/* Press / Media Logos */}
      <section className="border-y border-border/50 bg-surface-secondary py-8">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <p className="text-center text-xs text-content-muted uppercase tracking-wider mb-6 font-semibold">
            As featured in
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {pressLogos.map((name) => (
              <span
                key={name}
                className="text-content-muted/60 text-lg md:text-xl font-bold tracking-tight whitespace-nowrap select-none"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Pills */}
      <section className="pt-12 pb-2">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {filterPills.map((pill) => (
              <button
                key={pill.value}
                onClick={() => setActiveFilter(pill.value)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeFilter === pill.value
                    ? "bg-accent text-accent-text"
                    : "bg-surface-card border border-border text-content-secondary hover:border-accent/50 hover:text-content-primary"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Masonry Testimonial Grid */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          {filteredTestimonials.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-content-muted text-sm">No testimonials in this category yet.</p>
            </div>
          ) : (
            <>
              {/* Mobile: single column */}
              <div className="md:hidden space-y-5">
                {filteredTestimonials.map((t) => (
                  <TestimonialCard key={t.id} testimonial={t} />
                ))}
              </div>

              {/* Desktop: 3-column masonry */}
              <div className="hidden md:grid md:grid-cols-3 gap-5 items-start">
                {columns.map((col, colIdx) => (
                  <div key={colIdx} className="space-y-5">
                    {col.map((t) => (
                      <TestimonialCard key={t.id} testimonial={t} />
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-surface-secondary py-12 border-y border-border/50">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-accent">10,000+</div>
              <div className="text-xs text-content-muted mt-1">5-star reviews</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent">+1 Million</div>
              <div className="text-xs text-content-muted mt-1">Claims verified</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent">50,000+</div>
              <div className="text-xs text-content-muted mt-1">Active subscribers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-content-primary mb-4">
            Ready to see news differently?
          </h2>
          <p className="text-content-secondary max-w-xl mx-auto mb-8">
            Join thousands of investors, researchers, and developers who rely on Confirmd
            for evidence-based crypto news verification.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setLocation("/plus")}
              className="bg-accent text-accent-text px-8 py-3.5 rounded-lg text-sm font-bold hover:bg-accent-hover transition-all"
            >
              Subscribe Now
            </button>
            <button
              onClick={() => setLocation("/signup")}
              className="border border-border text-content-primary px-8 py-3.5 rounded-lg text-sm font-bold hover:bg-surface-card transition-all"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TestimonialsPage;
