import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../lib/auth-context";

type TabKey = "feed" | "discover" | "saved" | "sources";

const DashboardPage: React.FC = () => {
  const { isLoggedIn, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabKey>("feed");

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
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-content-primary tracking-tighter mb-3">
              Sign in to access your Dashboard
            </h1>
            <p className="text-content-secondary font-medium mb-8">
              Your personalized feed, saved stories, and source management
              are waiting for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setLocation("/login")}
                className="bg-accent text-accent-text text-sm font-black px-8 py-4 rounded-xl hover:bg-accent-hover transition-all uppercase tracking-wider"
              >
                Sign In
              </button>
              <button
                onClick={() => setLocation("/signup")}
                className="bg-surface-card text-content-primary text-sm font-bold px-8 py-4 rounded-xl border border-border hover:bg-surface-card-hover transition-all"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "feed", label: "My Feed" },
    { key: "discover", label: "Discover" },
    { key: "saved", label: "Saved Stories" },
    { key: "sources", label: "Manage Sources & Topics" },
  ];

  return (
    <div className="relative z-10 animate-in">
      {/* Tab Bar */}
      <section className="bg-surface-secondary border-b border-border sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-center space-x-1 overflow-x-auto py-3 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-bold whitespace-nowrap rounded-lg transition-all ${
                  activeTab === tab.key
                    ? "bg-accent text-accent-text"
                    : "text-content-secondary hover:text-content-primary hover:bg-surface-card-hover"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        {activeTab === "feed" && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-surface-card border border-border flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-content-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-content-primary tracking-tighter mb-3">
              My Feed
            </h2>
            <p className="text-content-secondary font-medium max-w-md mx-auto">
              Coming soon -- your personalized feed based on the sources and
              topics you follow. We are building something special.
            </p>
          </div>
        )}

        {activeTab === "discover" && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-content-primary tracking-tighter mb-3">
              Discover New Topics
            </h2>
            <p className="text-content-secondary font-medium max-w-md mx-auto mb-8">
              Explore trending topics, follow new sources, and customize your
              feed to match your interests.
            </p>
            <button
              onClick={() => setLocation("/signals")}
              className="bg-accent text-accent-text text-sm font-black px-8 py-4 rounded-xl hover:bg-accent-hover transition-all uppercase tracking-wider"
            >
              Sign Up and Discover New Topics
            </button>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-2xl mx-auto">
              {["DeFi", "Bitcoin", "Ethereum", "Regulation", "NFTs", "Layer 2", "Stablecoins", "Mining"].map(
                (topic) => (
                  <div
                    key={topic}
                    className="bg-surface-card rounded-xl border border-border p-4 text-center hover:bg-surface-card-hover transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-bold text-content-primary">
                      {topic}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {activeTab === "saved" && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-surface-card border border-border flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-content-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-content-primary tracking-tighter mb-3">
              Saved Stories
            </h2>
            <p className="text-content-secondary font-medium max-w-md mx-auto">
              Stories you save will appear here. Browse the feed and tap the
              bookmark icon on any story to save it for later.
            </p>
          </div>
        )}

        {activeTab === "sources" && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-surface-card border border-border flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-content-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-content-primary tracking-tighter mb-3">
              Manage Sources & Topics
            </h2>
            <p className="text-content-secondary font-medium max-w-md mx-auto">
              Coming soon -- manage which sources appear in your feed, set
              topic priorities, and customize your notification preferences.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
