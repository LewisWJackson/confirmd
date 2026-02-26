import React, { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { ThemeProvider } from "./lib/theme-context";
import { Layout } from "./components/Layout";
import FirmyChat from "./components/FirmyChat";

// All pages lazy-loaded so only the current route's JS is fetched on first visit
const FeedPage = lazy(() => import("./pages/FeedPage"));
const ClaimsPage = lazy(() => import("./pages/ClaimsPage"));
const ClaimDetailPage = lazy(() => import("./pages/ClaimDetailPage"));
const SourcesPage = lazy(() => import("./pages/SourcesPage"));
const SourceDetailPage = lazy(() => import("./pages/SourceDetailPage"));
const StoryDetailPage = lazy(() => import("./pages/StoryDetailPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const PlusPage = lazy(() => import("./pages/PlusPage"));
const SignalsPage = lazy(() => import("./pages/SignalsPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const CreatorsPage = lazy(() => import("./pages/CreatorsPage"));
const CreatorDetailPage = lazy(() => import("./pages/CreatorDetailPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const DailyBriefingPage = lazy(() => import("./pages/DailyBriefingPage"));
const TopicPage = lazy(() => import("./pages/TopicPage"));
const MethodologyPage = lazy(() => import("./pages/MethodologyPage"));
const NewsletterPage = lazy(() => import("./pages/NewsletterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const MyBiasPage = lazy(() => import("./pages/MyBiasPage"));
const TestimonialsPage = lazy(() => import("./pages/TestimonialsPage"));
const GroupSubsPage = lazy(() => import("./pages/GroupSubsPage"));
const GiftPage = lazy(() => import("./pages/GiftPage"));
const GiftConfirmationPage = lazy(() => import("./pages/GiftConfirmationPage"));
const GiftRedeemPage = lazy(() => import("./pages/GiftRedeemPage"));
const TrialPage = lazy(() => import("./pages/TrialPage"));
const CareersPage = lazy(() => import("./pages/CareersPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const CreatorClaimsPage = lazy(() => import("./pages/CreatorClaimsPage"));
const SourceClaimsPage = lazy(() => import("./pages/SourceClaimsPage"));
const SourceLeaderboardPage = lazy(
  () => import("./pages/SourceLeaderboardPage"),
);
const AdminPage = lazy(() => import("./pages/AdminPage"));

const PageFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
  </div>
);

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Layout>
        <Suspense fallback={<PageFallback />}>
          <Switch>
            <Route path="/" component={FeedPage} />
            <Route path="/claims/:id" component={ClaimDetailPage} />
            <Route path="/claims" component={ClaimsPage} />
            <Route path="/source-claims" component={SourceClaimsPage} />
            <Route
              path="/source-leaderboard"
              component={SourceLeaderboardPage}
            />
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
            <Route path="/gift/confirmation" component={GiftConfirmationPage} />
            <Route path="/gift/redeem" component={GiftRedeemPage} />
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
            <Route path="/admin" component={AdminPage} />
            <Route>
              <div className="max-w-7xl mx-auto px-6 py-32 text-center">
                <h1 className="text-5xl font-black text-content-primary tracking-tighter">
                  404
                </h1>
                <p className="text-content-secondary mt-4">Page not found</p>
              </div>
            </Route>
          </Switch>
        </Suspense>
      </Layout>
      <FirmyChat />
    </ThemeProvider>
  );
};

export default App;
