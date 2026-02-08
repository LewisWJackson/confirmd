import React from "react";
import { useLocation } from "wouter";
import { useAuth, tierLabel } from "../lib/auth-context";

const MyBiasPage: React.FC = () => {
  const { isLoggedIn, isLoading, user, tier } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-in">
        <div className="text-content-muted text-sm font-medium">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="relative z-10 animate-in">
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <h1 className="text-3xl font-black text-content-primary tracking-tighter mb-3">
              Sign in to view your News Bias
            </h1>
            <p className="text-content-secondary font-medium mb-8">
              Understand your reading patterns and discover your blind spots.
            </p>
            <button
              onClick={() => setLocation("/login")}
              className="bg-accent text-accent-text text-sm font-black px-8 py-4 rounded-xl hover:bg-accent-hover transition-all uppercase tracking-wider"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (tier === "free") {
    return (
      <div className="relative z-10 animate-in">
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="max-w-lg text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-content-primary tracking-tighter mb-3">
              My News Bias is a Premium Feature
            </h1>
            <p className="text-content-secondary font-medium mb-4">
              Upgrade to Tribune or Oracle to unlock detailed analysis of your
              reading patterns, factuality distribution, and blind spot
              detection.
            </p>
            <p className="text-sm text-content-muted mb-8">
              Current plan: {tierLabel(tier)}
            </p>
            <button
              onClick={() => setLocation("/plus")}
              className="bg-accent text-accent-text text-sm font-black px-8 py-4 rounded-xl hover:bg-accent-hover transition-all uppercase tracking-wider"
            >
              Upgrade to Plus
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Premium user view with placeholder data
  const displayName = user?.displayName || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative z-10 animate-in">
      {/* Hero */}
      <section className="bg-surface-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-12 pb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl md:text-4xl font-black text-content-primary tracking-tighter">
                My News Bias
              </h1>
              <span className="bg-accent/10 border border-accent/30 text-accent text-xs font-black px-3 py-1 rounded-lg uppercase tracking-wider">
                Demo Data
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-surface-card border border-border flex items-center justify-center">
                <span className="text-sm font-black text-content-primary">
                  {initials}
                </span>
              </div>
              <div>
                <div className="font-bold text-content-primary">{displayName}</div>
                <div className="text-xs text-content-muted">
                  {tierLabel(tier)} Plan
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stories Read Bar Chart */}
      <section className="bg-surface-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
          <h2 className="text-xl font-black text-content-primary tracking-tight mb-2">
            Stories Read
          </h2>
          <p className="text-sm text-content-muted mb-6">
            You have read 271 news stories this past week
          </p>

          <div className="bg-surface-card rounded-2xl border border-border p-6">
            <div className="flex items-end justify-between h-40 gap-2">
              {[
                { day: "Mon", count: 42 },
                { day: "Tue", count: 38 },
                { day: "Wed", count: 55 },
                { day: "Thu", count: 31 },
                { day: "Fri", count: 48 },
                { day: "Sat", count: 22 },
                { day: "Sun", count: 35 },
              ].map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-accent rounded-t-md transition-all"
                    style={{ height: `${(d.count / 55) * 100}%` }}
                  />
                  <span className="text-xs text-content-muted font-medium">
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Analysis Grid */}
      <section className="bg-surface-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
          <h2 className="text-xl font-black text-content-primary tracking-tight mb-8">
            Analysis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Ownership Distribution */}
            <div className="bg-surface-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-black text-content-primary uppercase tracking-wider mb-4">
                Ownership
              </h3>
              <p className="text-xs text-content-muted mb-6">
                3% of the news organizations you read are owned by Venture Capital firms
              </p>
              <div className="space-y-3">
                {[
                  { label: "Independent", pct: 42, color: "bg-factuality-high" },
                  { label: "Corporate Media", pct: 28, color: "bg-accent" },
                  { label: "Exchange-Owned", pct: 18, color: "bg-factuality-mixed" },
                  { label: "VC-Backed", pct: 9, color: "bg-factuality-low" },
                  { label: "Community", pct: 3, color: "bg-content-muted" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-content-secondary font-medium">{item.label}</span>
                      <span className="text-content-muted font-bold">{item.pct}%</span>
                    </div>
                    <div className="h-2 bg-surface-primary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Locality Bias */}
            <div className="bg-surface-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-black text-content-primary uppercase tracking-wider mb-4">
                Locality Bias
              </h3>
              <p className="text-xs text-content-muted mb-6">
                When you read the news, only 7% of your sources are international
              </p>
              <div className="flex items-center justify-center py-4">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle
                      cx="18" cy="18" r="14"
                      fill="none"
                      stroke="var(--border-color)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="18" cy="18" r="14"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="4"
                      strokeDasharray="88"
                      strokeDashoffset="22"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-accent">93%</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-content-muted text-center mt-2">
                Domestic sources
              </p>
            </div>

            {/* Factuality Distribution */}
            <div className="bg-surface-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-black text-content-primary uppercase tracking-wider mb-4">
                Factuality Distribution
              </h3>
              <p className="text-xs text-content-muted mb-6">
                Based on the current state of the crypto media, this chart tells you
                how much of the news you consume comes from high-factuality sources.
              </p>
              <div className="flex items-center justify-center py-4">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle
                      cx="18" cy="18" r="14"
                      fill="none"
                      stroke="var(--border-color)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="18" cy="18" r="14"
                      fill="none"
                      stroke="var(--factuality-high)"
                      strokeWidth="4"
                      strokeDasharray="88"
                      strokeDashoffset="12"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-factuality-high">86%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-4 mt-2">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-factuality-high" />
                  <span className="text-xs text-content-muted">High 86%</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-factuality-mixed" />
                  <span className="text-xs text-content-muted">Mixed 11%</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-factuality-low" />
                  <span className="text-xs text-content-muted">Low 3%</span>
                </div>
              </div>
            </div>

            {/* Blindspot Stories */}
            <div className="bg-surface-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-black text-content-primary uppercase tracking-wider mb-4">
                Blindspot Stories
              </h3>
              <p className="text-xs text-content-muted mb-6">
                You have read 15 news stories that were in the Blindspot this week
              </p>
              <div className="flex items-center justify-center py-4">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle
                      cx="18" cy="18" r="14"
                      fill="none"
                      stroke="var(--border-color)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="18" cy="18" r="14"
                      fill="none"
                      stroke="var(--factuality-mixed)"
                      strokeWidth="4"
                      strokeDasharray="88"
                      strokeDashoffset="44"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-factuality-mixed">50%</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-content-muted text-center mt-2">
                of blindspot stories read
              </p>
            </div>

            {/* Topic Insights */}
            <div className="bg-surface-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-black text-content-primary uppercase tracking-wider mb-4">
                Topic Insights
              </h3>
              <p className="text-xs text-content-muted mb-6">
                An interactive chart of the topics and subtopics you read about
              </p>
              <div className="space-y-3">
                {[
                  { label: "DeFi", pct: 28 },
                  { label: "Bitcoin", pct: 24 },
                  { label: "Regulation", pct: 18 },
                  { label: "Ethereum", pct: 15 },
                  { label: "NFTs", pct: 9 },
                  { label: "Other", pct: 6 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-content-secondary font-medium">{item.label}</span>
                      <span className="text-content-muted font-bold">{item.pct}%</span>
                    </div>
                    <div className="h-2 bg-surface-primary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Countries */}
            <div className="bg-surface-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-black text-content-primary uppercase tracking-wider mb-4">
                Countries you read news about
              </h3>
              <p className="text-xs text-content-muted mb-6">
                Geographic distribution of your news consumption
              </p>
              <div className="space-y-3">
                {[
                  { country: "United States", pct: 45 },
                  { country: "Global / Multi", pct: 22 },
                  { country: "United Kingdom", pct: 12 },
                  { country: "Singapore", pct: 8 },
                  { country: "South Korea", pct: 7 },
                  { country: "Other", pct: 6 },
                ].map((item) => (
                  <div key={item.country} className="flex items-center justify-between">
                    <span className="text-xs text-content-secondary font-medium">
                      {item.country}
                    </span>
                    <span className="text-xs text-content-muted font-bold">
                      {item.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Media Ownership */}
      <section className="bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
          <div className="bg-surface-card rounded-2xl border border-border p-8">
            <h3 className="text-lg font-black text-content-primary tracking-tight mb-2">
              Media Ownership
            </h3>
            <p className="text-sm text-content-secondary mb-6">
              77% of the sources you read are Independent News outlets
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Independent", pct: "77%", highlight: true },
                { label: "Corporate", pct: "12%", highlight: false },
                { label: "Exchange", pct: "8%", highlight: false },
                { label: "VC-Backed", pct: "3%", highlight: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl p-5 text-center ${
                    item.highlight
                      ? "bg-accent/10 border border-accent/30"
                      : "bg-surface-primary border border-border"
                  }`}
                >
                  <div
                    className={`text-2xl font-black mb-1 ${
                      item.highlight ? "text-accent" : "text-content-primary"
                    }`}
                  >
                    {item.pct}
                  </div>
                  <div className="text-xs text-content-muted font-medium">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-content-muted text-center mt-8">
            Disclaimer: Demo data is used for illustration. Your actual data
            will be calculated based on your reading history within Confirmd.
          </p>
        </div>
      </section>
    </div>
  );
};

export default MyBiasPage;
