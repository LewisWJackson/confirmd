import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { createCheckoutSession } from "../lib/api";
import testimonials from "../data/testimonials";

interface PlusFaqItem {
  question: string;
  answer: string;
}

const plusFaqs: PlusFaqItem[] = [
  {
    question: "Does Confirmd have a political agenda?",
    answer:
      "No. Confirmd is an independent verification platform. We use transparent, algorithmic methodology to assess claims. Our team spans a range of perspectives, and our scoring is based purely on evidence quality and source track records.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes. New users get a 7-day free trial when they subscribe to Premium or Pro. You can cancel anytime during the trial and you won't be charged.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards via Stripe, including Visa, Mastercard, and American Express. Cryptocurrency payments are coming soon.",
  },
  {
    question: "What happens if I cancel?",
    answer:
      "You retain access to all paid features through the end of your billing period. After that, your account reverts to the Vantage (free) tier. Your watchlist and data are preserved.",
  },
  {
    question: "Do you offer team or enterprise plans?",
    answer:
      "Yes. For teams of 5 or more, we offer custom pricing with shared dashboards, team watchlists, and dedicated support. Email hello@confirmd.io for details.",
  },
  {
    question: "How does Confirmd provide a bias-free rating on news stories?",
    answer:
      "Our scoring relies on quantitative methodology: Bayesian shrinkage on historical claim accuracy, evidence ladder quality assessment, and multi-source cross-referencing. No editorial judgment enters the rating pipeline.",
  },
];

// --- Tier icons (editorial SVG illustrations) ---

const VantageIcon: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="20" width="60" height="45" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M10 30h60" stroke="currentColor" strokeWidth="2" />
    <circle cx="20" cy="25" r="2" fill="currentColor" />
    <circle cx="27" cy="25" r="2" fill="currentColor" />
    <circle cx="34" cy="25" r="2" fill="currentColor" />
    <rect x="18" y="36" width="20" height="3" rx="1.5" fill="currentColor" opacity="0.5" />
    <rect x="18" y="43" width="28" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
    <rect x="18" y="50" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
    <path d="M52 38l4 4 8-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PremiumIcon: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M40 8l8 16 18 3-13 12 3 18-16-8-16 8 3-18L14 27l18-3z" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="40" cy="40" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M36 40l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 68h40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    <path d="M26 74h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
  </svg>
);

const ProIcon: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="36" r="22" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M28 36a12 12 0 0124 0" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="40" cy="36" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="40" cy="36" r="1.5" fill="currentColor" />
    <path d="M40 14v-4M40 60v4M18 36h-4M66 36h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M24 20l-2-2M56 20l2-2M24 52l-2 2M56 52l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="22" y="66" width="36" height="6" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M30 69h20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
  </svg>
);

// --- Tier definitions ---

interface TierFeature {
  label: string;
}

interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  price: string;
  period: string;
  icon: React.FC;
  imageSrc: string;
  highlight: boolean;
  badge?: string;
  ctaLabel: string;
  features: TierFeature[];
}

const tiers: PricingTier[] = [
  {
    id: "vantage",
    name: "Vantage",
    tagline: "See the full picture.",
    price: "$0",
    period: "/month",
    icon: VantageIcon,
    imageSrc: "/tier-images/vantage.png",
    highlight: false,
    ctaLabel: "Get Started",
    features: [
      { label: "Daily stories & factuality bars" },
      { label: "Source credibility scores" },
      { label: "Basic claim summaries" },
      { label: "Daily email briefing" },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Rise above the noise.",
    price: "$4.99",
    period: "/month",
    icon: PremiumIcon,
    imageSrc: "/tier-images/premium.png",
    highlight: true,
    badge: "Most Popular",
    ctaLabel: "Start Free Trial",
    features: [
      { label: "Everything in Vantage" },
      { label: "Full claim details" },
      { label: "Creator profiles & accuracy" },
      { label: "Evidence ladders" },
      { label: "90-day claim history" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Get full clarity.",
    price: "$9.99",
    period: "/month",
    icon: ProIcon,
    imageSrc: "/tier-images/pro.png",
    highlight: false,
    ctaLabel: "Start Free Trial",
    features: [
      { label: "Everything in Premium" },
      { label: "Creator leaderboard" },
      { label: "Source leaderboard" },
      { label: "Blindspot reports" },
      { label: "Real-time alerts" },
      { label: "Priority support" },
    ],
  },
];

// --- Comparison table data ---

interface ComparisonRow {
  feature: string;
  vantage: boolean;
  premium: boolean;
  pro: boolean;
}

const comparisonRows: ComparisonRow[] = [
  { feature: "Daily stories & factuality bars", vantage: true, premium: true, pro: true },
  { feature: "Source credibility scores", vantage: true, premium: true, pro: true },
  { feature: "Full claim details", vantage: false, premium: true, pro: true },
  { feature: "Creator profiles & accuracy", vantage: false, premium: true, pro: true },
  { feature: "Evidence ladders", vantage: false, premium: true, pro: true },
  { feature: "90-day claim history", vantage: false, premium: true, pro: true },
  { feature: "Creator leaderboard", vantage: false, premium: false, pro: true },
  { feature: "Source leaderboard", vantage: false, premium: false, pro: true },
  { feature: "Blindspot reports", vantage: false, premium: false, pro: true },
  { feature: "Real-time alerts", vantage: false, premium: false, pro: true },
  { feature: "Priority support", vantage: false, premium: false, pro: true },
];

// --- Check / Dash icons ---

const CheckIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

const DashIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
  </svg>
);

// --- Tier image with SVG fallback ---

const TierImage: React.FC<{ tier: PricingTier }> = ({ tier }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const Icon = tier.icon;

  if (imgFailed) {
    return (
      <div className={`w-full aspect-[4/3] mb-5 rounded-lg flex items-center justify-center ${
        tier.highlight ? "bg-accent/10" : "bg-surface-card-hover"
      }`}>
        <div className={`w-20 h-20 ${tier.highlight ? "text-accent" : "text-content-secondary"}`}>
          <Icon />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full aspect-[4/3] mb-5 rounded-lg overflow-hidden ${
      tier.highlight ? "bg-accent/10" : "bg-surface-card-hover"
    }`}>
      <img
        src={tier.imageSrc}
        alt={`${tier.name} tier illustration`}
        className="w-full h-full object-cover"
        onError={() => setImgFailed(true)}
      />
    </div>
  );
};

const PlusPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [carouselPage, setCarouselPage] = useState(0);
  const carouselTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pick 12 testimonials for the Plus page carousel (3 per page, 4 pages)
  const plusTestimonials = testimonials.slice(0, 12);
  const cardsPerPage = 3;
  const totalPages = Math.ceil(plusTestimonials.length / cardsPerPage);

  const advanceCarousel = useCallback(() => {
    setCarouselPage((prev) => (prev + 1) % totalPages);
  }, [totalPages]);

  useEffect(() => {
    carouselTimerRef.current = setInterval(advanceCarousel, 6000);
    return () => {
      if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    };
  }, [advanceCarousel]);

  const goToPage = (page: number) => {
    setCarouselPage(page);
    if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    carouselTimerRef.current = setInterval(advanceCarousel, 6000);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setShowSuccess(true);
      window.history.replaceState({}, "", "/plus");
    }
  }, []);

  const handleSubscribe = async (tierId: string) => {
    if (tierId === "vantage") {
      setLocation("/signup");
      return;
    }
    setCheckoutError(null);
    setLoadingTier(tierId);
    try {
      const { url } = await createCheckoutSession(tierId);
      if (url) window.location.href = url;
    } catch (err) {
      console.error("Checkout error:", err);
      setCheckoutError("Unable to start checkout. Please sign in first or try again.");
      setLoadingTier(null);
    }
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="relative z-10 bg-surface-primary min-h-screen">
      {/* Success Banner */}
      {showSuccess && (
        <div className="max-w-6xl mx-auto px-6 md:px-12 pt-6">
          <div className="bg-green-900/30 border border-green-700 rounded-lg px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-semibold text-green-300">
                Subscription activated! Welcome to Confirmd+.
              </span>
            </div>
            <button onClick={() => setShowSuccess(false)} className="text-green-500 hover:text-green-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="pt-16 pb-4 text-center">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h1 className="text-4xl md:text-5xl font-bold text-content-primary tracking-tight mb-4">
            Subscription Options
          </h1>
          <p className="text-content-secondary text-lg max-w-2xl mx-auto">
            Evidence-based clarity on the claims that matter most. Choose the plan that fits your needs.
          </p>
        </div>
      </section>

      {/* Checkout Error */}
      {checkoutError && (
        <section className="max-w-2xl mx-auto px-6 md:px-12 pb-4">
          <div className="bg-red-900/30 border border-red-700 rounded-lg px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-red-300">{checkoutError}</span>
            </div>
            <button onClick={() => setCheckoutError(null)} className="text-red-500 hover:text-red-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </section>
      )}

      {/* 3-Tier Pricing Cards */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {tiers.map((tier) => {
            const isLoading = loadingTier === tier.id;
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                className={`relative rounded-xl border overflow-hidden bg-surface-card flex flex-col ${
                  tier.highlight
                    ? "border-accent ring-2 ring-accent"
                    : "border-border"
                }`}
              >
                {/* Most Popular badge */}
                {tier.badge && (
                  <div className="bg-accent text-accent-text text-xs font-bold uppercase tracking-wider text-center py-1.5">
                    {tier.badge}
                  </div>
                )}

                {/* Card body */}
                <div className="px-6 pt-6 pb-4 flex-1 flex flex-col">
                  {/* Tier name row */}
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-content-primary">{tier.name}</h3>
                    {tier.id === "vantage" && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/20 text-accent px-2 py-0.5 rounded">
                        Free
                      </span>
                    )}
                  </div>

                  {/* Tagline */}
                  <p className="text-sm text-content-secondary mb-5 italic">{tier.tagline}</p>

                  {/* Tier illustration */}
                  <TierImage tier={tier} />

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-4xl font-bold text-content-primary">{tier.price}</span>
                    <span className="text-content-muted text-sm">{tier.period}</span>
                  </div>

                  {/* Features list */}
                  <ul className="space-y-3 mb-6 flex-1">
                    {tier.features.map((f) => (
                      <li key={f.label} className="flex items-start gap-2.5">
                        <CheckIcon className="text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-content-primary">{f.label}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA button */}
                  <button
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={isLoading}
                    className={`w-full py-3.5 rounded-lg text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-wait ${
                      tier.highlight
                        ? "bg-accent text-accent-text hover:bg-accent-hover"
                        : "border border-accent text-accent hover:bg-accent hover:text-accent-text"
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Redirecting...</span>
                      </span>
                    ) : (
                      tier.ctaLabel
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="bg-surface-secondary py-20 relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="testimonial-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="currentColor" className="text-accent" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#testimonial-grid)" />
          </svg>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
          {/* Hero stat */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-1 mb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <div className="text-3xl md:text-4xl font-bold text-content-primary mb-2">
              10,000+ 5-star reviews
            </div>
            <p className="text-content-secondary text-sm">
              See why thousands trust Confirmd for verified crypto news
            </p>
          </div>

          {/* Carousel cards */}
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${carouselPage * 100}%)` }}
            >
              {Array.from({ length: totalPages }).map((_, pageIdx) => (
                <div
                  key={pageIdx}
                  className="w-full flex-shrink-0 grid grid-cols-1 md:grid-cols-3 gap-6 px-1"
                >
                  {plusTestimonials
                    .slice(pageIdx * cardsPerPage, pageIdx * cardsPerPage + cardsPerPage)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="bg-surface-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 flex flex-col"
                      >
                        {/* Star rating */}
                        <div className="flex items-center space-x-0.5 mb-4">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${
                                i < t.rating ? "text-accent" : "text-content-muted/30"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          ))}
                        </div>

                        {/* Quote */}
                        <blockquote className="text-sm text-content-primary leading-relaxed flex-1 mb-5">
                          "{t.quote}"
                        </blockquote>

                        {/* Author */}
                        <div className="flex items-center space-x-3 pt-4 border-t border-border/30">
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
                    ))}
                </div>
              ))}
            </div>
          </div>

          {/* Carousel dots */}
          <div className="flex items-center justify-center space-x-2 mt-8">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === carouselPage
                    ? "bg-accent w-6"
                    : "bg-content-muted/30 hover:bg-content-muted/50"
                }`}
                aria-label={`Go to testimonial page ${i + 1}`}
              />
            ))}
          </div>

          {/* See all link */}
          <div className="text-center mt-6">
            <button
              onClick={() => setLocation("/testimonials")}
              className="text-accent text-sm font-semibold hover:underline transition-all"
            >
              Read all reviews &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 pr-4 text-sm font-bold text-content-primary w-2/5">
                    Features
                  </th>
                  {tiers.map((tier) => (
                    <th key={tier.id} className="py-4 px-3 text-center">
                      <div className="text-sm font-bold text-content-primary">{tier.name}</div>
                      <div className="text-xs text-content-muted mt-0.5">{tier.price}{tier.period}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-border/50 ${
                      idx % 2 === 0 ? "bg-surface-card/30" : ""
                    }`}
                  >
                    <td className="py-4 pr-4 text-sm text-content-secondary">
                      {row.feature}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {row.vantage ? (
                        <CheckIcon className="text-accent mx-auto" />
                      ) : (
                        <DashIcon className="text-content-muted/40 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {row.premium ? (
                        <CheckIcon className="text-accent mx-auto" />
                      ) : (
                        <DashIcon className="text-content-muted/40 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {row.pro ? (
                        <CheckIcon className="text-accent mx-auto" />
                      ) : (
                        <DashIcon className="text-content-muted/40 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Pricing row at bottom of table */}
              <tfoot>
                <tr className="border-t border-border">
                  <td className="py-6 pr-4"></td>
                  {tiers.map((tier) => (
                    <td key={tier.id} className="py-6 px-3 text-center">
                      <div className="flex items-baseline justify-center gap-1 mb-3">
                        <span className="text-2xl font-bold text-content-primary">{tier.price}</span>
                        <span className="text-content-muted text-xs">{tier.period}</span>
                      </div>
                      <button
                        onClick={() => handleSubscribe(tier.id)}
                        disabled={loadingTier === tier.id}
                        className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60 disabled:cursor-wait ${
                          tier.highlight
                            ? "bg-accent text-accent-text hover:bg-accent-hover"
                            : "border border-accent text-accent hover:bg-accent hover:text-accent-text"
                        }`}
                      >
                        {loadingTier === tier.id ? "Redirecting..." : tier.ctaLabel}
                      </button>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-content-primary text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-2">
            {plusFaqs.map((faq, idx) => {
              const isOpen = openFaqs[idx] ?? false;
              return (
                <div
                  key={idx}
                  className="border border-border rounded-lg bg-surface-card overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-card-hover transition-colors"
                  >
                    <span className="text-sm font-semibold text-content-primary pr-4">
                      {faq.question}
                    </span>
                    <svg
                      className={`w-5 h-5 text-content-muted flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 pb-5 text-sm text-content-secondary leading-relaxed border-t border-border pt-4">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gift Subscriptions Callout */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 pb-20">
        <div className="bg-surface-card border border-border rounded-xl p-8 md:p-12 text-center">
          <h3 className="text-2xl font-bold text-content-primary mb-2">Gift Subscriptions</h3>
          <p className="text-content-secondary text-sm max-w-lg mx-auto mb-6">
            Give the gift of perspective, naturally. A perfect gift for a curious person in your life who values verified information.
          </p>
          <button
            onClick={() => setLocation("/gift")}
            className="border border-accent text-accent px-6 py-3 rounded-lg text-sm font-bold hover:bg-accent hover:text-accent-text transition-all"
          >
            Gift Subscriptions Now
          </button>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-surface-secondary py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-content-primary mb-4">
            Confirmd is supported by our subscribers.
          </h2>
          <p className="text-content-secondary max-w-2xl mx-auto mb-8">
            Our mission is to empower people with transparent, evidence-based verification of crypto claims.
            Every subscription helps us remain independent, unbiased, and committed to factual reporting.
          </p>
          <button
            onClick={() => handleSubscribe("premium")}
            disabled={loadingTier === "premium"}
            className="bg-accent text-accent-text px-8 py-4 rounded-lg text-sm font-bold hover:bg-accent-hover transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            {loadingTier === "premium" ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Redirecting...</span>
              </span>
            ) : (
              "Become a subscriber"
            )}
          </button>
        </div>
      </section>
    </div>
  );
};

export default PlusPage;
