import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import posthog from "posthog-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/auth-context";
import App from "./App";
import "./index.css";

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// TODO: Set VITE_SENTRY_DSN in Railway environment variables
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.2,
});

// TODO: Set VITE_POSTHOG_KEY in Railway environment variables
posthog.init(import.meta.env.VITE_POSTHOG_KEY ?? "", {
  api_host: "https://app.posthog.com",
  loaded: (ph) => {
    if (!import.meta.env.VITE_POSTHOG_KEY) ph.opt_out_capturing();
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element");
}

// Remove inline loading overlay once React takes over
const loadingEl = document.getElementById("__loading");
if (loadingEl) loadingEl.remove();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
