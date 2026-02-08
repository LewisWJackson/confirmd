import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, logout } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { ThemeToggle } from "./ThemeToggle";

const topicPills = [
  { label: "Bitcoin", slug: "bitcoin" },
  { label: "Ethereum", slug: "ethereum" },
  { label: "DeFi", slug: "defi" },
  { label: "Regulation", slug: "regulation" },
  { label: "Security", slug: "security" },
  { label: "Markets", slug: "markets" },
  { label: "NFTs", slug: "nfts" },
  { label: "Stablecoins", slug: "stablecoins" },
  { label: "Layer 2", slug: "layer-2" },
  { label: "DAOs", slug: "daos" },
];

const navItems = [
  { path: "/", label: "Home" },
  { path: "/creator-claims", label: "Creator Claims" },
];

export const Header: React.FC = () => {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { tier } = useAuth();

  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  const { data: user } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    staleTime: 60_000,
    retry: false,
  });

  const handleLogout = async () => {
    await logout();
    queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    setShowUserMenu(false);
  };

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top banner */}
      <div className="bg-[#c4a97d] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-1.5 flex items-center justify-center gap-3 text-xs font-medium">
          <span>See every side of every crypto story</span>
          <button
            onClick={() => setLocation("/plus")}
            className="bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold px-3 py-0.5 rounded-full transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Main header row */}
      <div className="bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          {/* Left: Logo */}
          <button
            onClick={() => setLocation("/")}
            className="text-xl font-black text-white uppercase tracking-tight leading-none hover:opacity-80 transition-opacity"
          >
            CONFIRMD
          </button>

          {/* Center nav (desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map(({ path, label }) => (
              <button
                key={path}
                onClick={() => setLocation(path)}
                className={`relative text-sm font-medium transition-colors pb-1 ${
                  isActive(path) ? "text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {label}
                {isActive(path) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c4a97d] rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Search icon */}
            <button
              onClick={() => setLocation("/sources")}
              className="text-gray-400 hover:text-white transition-colors p-1.5"
              aria-label="Search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Theme toggle */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Subscribe button */}
            <button
              onClick={() => setLocation("/plus")}
              className="hidden sm:block bg-[#c4a97d] text-[#1a1a1a] text-xs font-bold px-4 py-1.5 rounded-full hover:bg-[#d4b98d] transition-colors"
            >
              Subscribe
            </button>

            {/* Auth area */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 text-white text-xs font-medium px-3 py-1.5 rounded-full border border-gray-600 hover:border-gray-400 transition-colors"
                >
                  <div className="w-5 h-5 bg-[#c4a97d] rounded-full flex items-center justify-center text-[10px] font-bold text-[#1a1a1a]">
                    {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline">
                    {user.displayName || "Account"}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-[#242424] rounded-lg shadow-2xl border border-gray-700 overflow-hidden z-50 animate-in fade-in">
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-xs font-semibold text-white truncate">
                        {user.displayName || "User"}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {user.email}
                      </p>
                      {user.subscriptionTier &&
                        user.subscriptionTier !== "free" && (
                          <div className="mt-1.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#c4a97d]/20 text-[#c4a97d] rounded-md">
                              {user.subscriptionTier}
                            </span>
                          </div>
                        )}
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setLocation("/plus");
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-[#c4a97d] transition-colors"
                      >
                        Manage Subscription
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-red-900/30 hover:text-red-400 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setLocation("/login")}
                className="text-white text-xs font-medium px-3 py-1.5 rounded-full border border-gray-600 hover:border-gray-400 transition-colors"
              >
                Sign In
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-gray-400 hover:text-white transition-colors p-1.5"
              aria-label="Menu"
            >
              {showMobileMenu ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-800 px-4 py-3 space-y-2 animate-in fade-in">
            {navItems.map(({ path, label }) => (
              <button
                key={path}
                onClick={() => {
                  setLocation(path);
                  setShowMobileMenu(false);
                }}
                className={`block w-full text-left text-sm font-medium py-2 px-3 rounded-lg transition-colors ${
                  isActive(path)
                    ? "text-[#c4a97d] bg-white/5"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            ))}
            <div className="pt-2 border-t border-gray-800">
              <div className="flex items-center gap-3 py-2 px-3">
                <span className="text-xs text-gray-500">Theme:</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}

        {/* Topic pills (horizontal scroll) */}
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-2">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {topicPills.map(({ label, slug }) => (
                <button
                  key={slug}
                  onClick={() => setLocation(`/topics/${slug}`)}
                  className="flex-shrink-0 text-[11px] font-medium text-gray-400 border border-gray-700 rounded-full px-3 py-1 hover:border-[#c4a97d] hover:text-[#c4a97d] transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
