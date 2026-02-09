import React from "react";
import { Switch, Route } from "wouter";
import { ThemeProvider } from "./lib/theme-context";
import { Layout } from "./components/Layout";
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
import SignalsPage from "./pages/SignalsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import CreatorsPage from "./pages/CreatorsPage";
import CreatorDetailPage from "./pages/CreatorDetailPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import SearchPage from "./pages/SearchPage";
import DailyBriefingPage from "./pages/DailyBriefingPage";
import TopicPage from "./pages/TopicPage";
import MethodologyPage from "./pages/MethodologyPage";
import NewsletterPage from "./pages/NewsletterPage";
import DashboardPage from "./pages/DashboardPage";
import MyBiasPage from "./pages/MyBiasPage";
import TestimonialsPage from "./pages/TestimonialsPage";
import GroupSubsPage from "./pages/GroupSubsPage";
import GiftPage from "./pages/GiftPage";
import TrialPage from "./pages/TrialPage";
import CareersPage from "./pages/CareersPage";
import ContactPage from "./pages/ContactPage";
import TermsPage from "./pages/TermsPage";
import CreatorClaimsPage from "./pages/CreatorClaimsPage";
import FirmyChat from "./components/FirmyChat";

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Layout>
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
          <Route path="/signals" component={SignalsPage} />
          <Route path="/search" component={SearchPage} />
          <Route path="/briefing" component={DailyBriefingPage} />
          <Route path="/daily-briefing" component={DailyBriefingPage} />
          <Route path="/topics/:slug" component={TopicPage} />
          <Route path="/topic/:slug" component={TopicPage} />
          <Route path="/methodology" component={MethodologyPage} />
          <Route path="/newsletter" component={NewsletterPage} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/my-bias" component={MyBiasPage} />
          <Route path="/testimonials" component={TestimonialsPage} />
          <Route path="/groups" component={GroupSubsPage} />
          <Route path="/gift" component={GiftPage} />
          <Route path="/trial" component={TrialPage} />
          <Route path="/careers" component={CareersPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/terms" component={TermsPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/faq" component={FaqPage} />
          <Route path="/privacy" component={PrivacyPage} />
          <Route path="/plus" component={PlusPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/signup" component={SignupPage} />
          <Route path="/creator-claims" component={CreatorClaimsPage} />
          <Route>
            <div className="max-w-7xl mx-auto px-6 py-32 text-center">
              <h1 className="text-5xl font-black text-content-primary tracking-tighter">404</h1>
              <p className="text-content-secondary mt-4">Page not found</p>
            </div>
          </Route>
        </Switch>
      </Layout>
      <FirmyChat />
    </ThemeProvider>
  );
};

export default App;
