
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMe, logout } from '../lib/api';
import { useAuth } from '../lib/auth-context';

export const Header: React.FC = () => {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    staleTime: 60_000,
    retry: false,
  });

  const handleLogout = async () => {
    await logout();
    queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    setShowUserMenu(false);
  };

  const { tier } = useAuth();

  const navItems = [
    { path: '/', label: 'Stories', gated: false },
    { path: '/blindspot', label: 'Blindspot', gated: false },
    { path: '/sources', label: 'Sources', gated: false },
    { path: '/signals', label: 'Signals', gated: true },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 px-6 md:px-12 py-5 glass border-b border-slate-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-12">
          <div
            onClick={() => setLocation('/')}
            className="flex items-center cursor-pointer group"
          >
            <div className="order-1">
              <span className="text-2xl font-black logo-text text-slate-900 leading-none tracking-tighter uppercase transition-colors">Confirmd</span>
            </div>
            <div className="w-7 h-7 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[4px_4px_12px_rgba(6,182,212,0.3)] rotate-6 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300 order-2 ml-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <nav className="hidden lg:flex items-center space-x-10 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            {navItems.map(({ path, label, gated }) => (
              <button
                key={path}
                onClick={() => setLocation(path)}
                className={`${isActive(path) ? 'text-cyan-600' : 'hover:text-slate-900'} transition-all flex flex-col items-center`}
              >
                <span className="flex items-center gap-1.5">
                  {label}
                  {gated && tier === "free" && (
                    <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </span>
                {isActive(path) && <div className="w-1 h-1 bg-cyan-600 rounded-full mt-1.5 shadow-[0_0_5px_cyan]"></div>}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-6">
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Search intelligence..."
              className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-2.5 text-xs font-medium focus:ring-1 focus:ring-cyan-500/50 outline-none w-44 transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => setLocation('/plus')}
            className="hidden sm:block text-[10px] font-black px-5 py-2.5 rounded-xl border border-cyan-200 text-cyan-600 hover:bg-cyan-50 transition-all uppercase tracking-widest"
          >
            Plus
          </button>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 bg-slate-900 text-white text-[10px] font-black px-5 py-3 rounded-xl hover:bg-cyan-600 transition-all shadow-xl uppercase tracking-widest"
              >
                <div className="w-6 h-6 bg-cyan-500 rounded-lg flex items-center justify-center text-[10px] font-black text-white">
                  {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline">{user.displayName || "Account"}</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.displayName || "User"}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
                    {user.subscriptionTier && user.subscriptionTier !== "free" && (
                      <div className="mt-2">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-cyan-50 text-cyan-600 rounded-md border border-cyan-100">
                          {user.subscriptionTier}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setLocation("/plus"); setShowUserMenu(false); }}
                      className="w-full text-left px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-cyan-600 transition-colors"
                    >
                      Manage Subscription
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-5 py-3 text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setLocation('/login')}
              className="bg-slate-900 text-white text-[10px] font-black px-6 py-3 rounded-xl hover:bg-cyan-600 transition-all shadow-xl uppercase tracking-widest"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
