import React, { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../lib/api";

const LoginPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      setLocation("/");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 animate-in fade-in duration-700 relative z-10">
      <div className="w-full max-w-md glass p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-[60px] pointer-events-none" />
        <div className="relative z-10">
          <div className="mb-10">
            <span className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.3em]">
              Identity Protocol
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter mt-2">
              Sign In
            </h1>
            <p className="text-sm text-slate-400 font-medium mt-2">
              Access your verified intelligence dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium flex items-start space-x-3 animate-in fade-in duration-300">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full bg-slate-50 border border-slate-200 rounded-[1rem] px-5 py-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 outline-none transition-all placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full bg-slate-50 border border-slate-200 rounded-[1rem] px-5 py-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 outline-none transition-all placeholder:text-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] hover:bg-cyan-600 transition-all shadow-xl disabled:opacity-50 disabled:cursor-wait"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Authenticating...</span>
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400 font-medium">
            Don't have an account?{" "}
            <button
              onClick={() => setLocation("/signup")}
              className="text-cyan-600 font-bold hover:text-cyan-700 transition-colors"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
