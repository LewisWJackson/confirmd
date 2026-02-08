import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { Header } from "./components/Header";
import { GridBackground } from "./components/GridBackground";
import FeedPage from "./pages/FeedPage";
import ClaimsPage from "./pages/ClaimsPage";
import ClaimDetailPage from "./pages/ClaimDetailPage";
import SourcesPage from "./pages/SourcesPage";
import SourceDetailPage from "./pages/SourceDetailPage";
import StoryDetailPage from "./pages/StoryDetailPage";
import AboutPage from "./pages/AboutPage";
import FaqPage from "./pages/FaqPage";
import PrivacyPage from "./pages/PrivacyPage";
import PlusPage from "./pages/PlusPage";
import BlindspotPage from "./pages/BlindspotPage";
import SignalsPage from "./pages/SignalsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import CreatorsPage from "./pages/CreatorsPage";
import CreatorDetailPage from "./pages/CreatorDetailPage";
import LeaderboardPage from "./pages/LeaderboardPage";

const App: React.FC = () => {
  const [location, setLocation] = useLocation();

  const currentPage = (() => {
    if (location === "/") return "home";
    if (location.startsWith("/claims/")) return "claims";
    if (location.startsWith("/claims")) return "claims";
    if (location.startsWith("/sources")) return "sources";
    if (location.startsWith("/stories/")) return "story";
    if (location.startsWith("/blindspot")) return "blindspot";
    if (location.startsWith("/creators/")) return "creators";
    if (location.startsWith("/creators")) return "creators";
    if (location.startsWith("/leaderboard")) return "leaderboard";
    if (location.startsWith("/signals")) return "signals";
    if (location.startsWith("/about")) return "about";
    if (location.startsWith("/faq")) return "faq";
    if (location.startsWith("/privacy")) return "privacy";
    if (location.startsWith("/plus")) return "plus";
    if (location.startsWith("/login")) return "login";
    if (location.startsWith("/signup")) return "signup";
    return "home";
  })();

  const onNavigate = (page: string) => {
    const routes: Record<string, string> = {
      home: "/",
      claims: "/claims",
      sources: "/sources",
      blindspot: "/blindspot",
      creators: "/creators",
      leaderboard: "/leaderboard",
      signals: "/signals",
      about: "/about",
      faq: "/faq",
      privacy: "/privacy",
      plus: "/plus",
    };
    setLocation(routes[page] || "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col relative transition-colors duration-500 bg-white">
      <GridBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Switch>
            <Route path="/" component={FeedPage} />
            <Route path="/claims/:id" component={ClaimDetailPage} />
            <Route path="/claims" component={ClaimsPage} />
            <Route path="/sources/:id" component={SourceDetailPage} />
            <Route path="/sources" component={SourcesPage} />
            <Route path="/stories/:id" component={StoryDetailPage} />
            <Route path="/creators/:id" component={CreatorDetailPage} />
            <Route path="/creators" component={CreatorsPage} />
            <Route path="/leaderboard" component={LeaderboardPage} />
            <Route path="/blindspot" component={BlindspotPage} />
            <Route path="/signals" component={SignalsPage} />
            <Route path="/about" component={AboutPage} />
            <Route path="/faq" component={FaqPage} />
            <Route path="/privacy" component={PrivacyPage} />
            <Route path="/plus" component={PlusPage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/signup" component={SignupPage} />
            <Route>
              <div className="max-w-7xl mx-auto px-6 py-32 text-center">
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter">404</h1>
                <p className="text-slate-500 mt-4">Page not found</p>
              </div>
            </Route>
          </Switch>
        </main>
        <footer className="bg-slate-900 text-slate-400 py-32 px-6 md:px-12 z-20 border-t border-slate-800 mt-auto">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-24 mb-32">
              <div className="col-span-1 md:col-span-1 space-y-12">
                <div className="flex items-center group cursor-pointer" onClick={() => onNavigate("home")}>
                  <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-5 flex flex-col leading-none">
                    <span className="text-2xl font-black text-white uppercase tracking-tighter">Confirmd</span>
                  </div>
                </div>
                <p className="text-lg font-medium leading-relaxed text-slate-400 max-w-sm">
                  Verified signal detection for the decentralized era. Filter the noise, find the truth.
                </p>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Product</h4>
                <div className="space-y-3">
                  {[
                    { label: "Stories", path: "home" },
                    { label: "Blindspot", path: "blindspot" },
                    { label: "Sources", path: "sources" },
                    { label: "Signals", path: "signals" },
                  ].map((item) => (
                    <button key={item.path} onClick={() => onNavigate(item.path)} className="block text-sm text-slate-400 hover:text-white transition-colors font-medium">
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Company</h4>
                <div className="space-y-3">
                  {[
                    { label: "About", path: "about" },
                    { label: "FAQ", path: "faq" },
                    { label: "Privacy", path: "privacy" },
                    { label: "Confirmd Plus", path: "plus" },
                  ].map((item) => (
                    <button key={item.path} onClick={() => onNavigate(item.path)} className="block text-sm text-slate-400 hover:text-white transition-colors font-medium">
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Contact</h4>
                <p className="text-sm text-slate-400 font-medium">hello@confirmd.io</p>
                <p className="text-sm text-slate-400 font-medium">@confirmd on X</p>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-16 flex flex-col md:flex-row justify-between items-center text-[10px] font-black tracking-[0.5em] uppercase opacity-50">
              <span>&copy; 2026 CONFIRMD DATA SYSTEMS</span>
              <div className="flex space-x-16 mt-8 md:mt-0">
                <span className="text-cyan-500">Verified System</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
