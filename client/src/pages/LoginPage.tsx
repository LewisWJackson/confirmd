import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../lib/api";

const LoginPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Auto-dismiss info message after 5 seconds
  useEffect(() => {
    if (!infoMessage) return;
    const timer = setTimeout(() => setInfoMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [infoMessage]);

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
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12 bg-surface-primary">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-3xl font-bold text-content-primary tracking-tight">
            CONFIRMD
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-surface-secondary border border-border rounded-xl p-8">
          <h1 className="text-xl font-bold text-content-primary text-center mb-8">
            Log in to your account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-sm text-red-400 font-medium flex items-start space-x-2">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {infoMessage && (
              <div className="p-3 bg-amber-900/20 border border-amber-600/50 rounded-lg text-sm text-amber-300 font-medium flex items-start space-x-2">
                <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{infoMessage}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-content-secondary block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                autoComplete="email"
                className="w-full bg-surface-primary border border-border rounded-lg px-4 py-3 text-sm text-content-primary focus:ring-2 focus:ring-accent/40 focus:border-accent outline-none transition-all placeholder:text-content-muted"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-content-secondary block mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete="current-password"
                className="w-full bg-surface-primary border border-border rounded-lg px-4 py-3 text-sm text-content-primary focus:ring-2 focus:ring-accent/40 focus:border-accent outline-none transition-all placeholder:text-content-muted"
              />
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <button
                type="button"
                className="text-xs text-accent hover:underline font-medium"
              >
                Forgot your password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 border border-border text-content-primary rounded-lg text-sm font-bold hover:bg-surface-card transition-all disabled:opacity-50 disabled:cursor-wait"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Logging in...</span>
                </span>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-border" />
            <span className="px-4 text-xs text-content-muted">or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Social auth */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => { setError(""); setInfoMessage("Google sign-in coming soon. Please use email and password."); }}
              className="w-full py-3 border border-border rounded-lg text-sm font-medium text-content-primary hover:bg-surface-card transition-all flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={() => { setError(""); setInfoMessage("Apple sign-in coming soon. Please use email and password."); }}
              className="w-full py-3 border border-border rounded-lg text-sm font-medium text-content-primary hover:bg-surface-card transition-all flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>

          {/* Create account link */}
          <p className="mt-8 text-center text-sm text-content-secondary">
            Don't have an account?{" "}
            <button
              onClick={() => setLocation("/signup")}
              className="text-accent font-bold hover:underline"
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
