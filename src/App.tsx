import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LinkPreviewProvider } from "@/components/LinkPreviewProvider";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import NoindexHead from "./components/NoindexHead.tsx";


const Index = lazy(() => import("./pages/Index.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const AuthCallback = lazy(() => import("./pages/AuthCallback.tsx"));
const LegacyEntryRedirect = lazy(() => import("./pages/LegacyEntryRedirect.tsx"));
const UserProfile = lazy(() => import("./pages/UserProfile.tsx"));
const Messages = lazy(() => import("./pages/Messages.tsx"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const UsernameOnboarding = lazy(() => import("./pages/UsernameOnboarding.tsx"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail.tsx"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe.tsx"));
const EntityProfile = lazy(() => import("./pages/EntityProfile.tsx"));
const LegacyUserRedirect = lazy(() => import("./pages/LegacyUserRedirect.tsx"));
const ModDashboard = lazy(() => import("./pages/ModDashboard.tsx"));
const ModLogin = lazy(() => import("./pages/ModLogin.tsx"));


// Global react-query defaults:
// - staleTime 60s avoids re-running every entry/comment/profile query on
//   focus/remount (huge backend-load reduction).
// - refetchOnWindowFocus off (mobile tab switches were re-hitting Supabase).
// - retry capped at 1 — original default of 3 multiplies failures during
//   incidents and blocks UI for many seconds.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
    mutations: { retry: 0 },
  },
});

/**
 * Global gate: any signed-in user whose profile.username_chosen === false
 * gets bounced to the onboarding flow (skipped on /auth and /onboarding itself).
 */
const OnboardingGate = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !user || !profile) return;
    if (profile.username_chosen) return;
    if (location.pathname.startsWith("/onboarding") || location.pathname.startsWith("/auth")) return;
    navigate("/onboarding/username", { replace: true });
  }, [loading, user, profile, location.pathname, navigate]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OnboardingGate />
          <LinkPreviewProvider>
            <ErrorBoundary label="App">
              <Suspense fallback={
                <div className="min-h-screen bg-background flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-label="Yükleniyor" />
                </div>
              }>

                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/onboarding/username" element={<UsernameOnboarding />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/e/:id" element={<LegacyEntryRedirect />} />
                  <Route path="/u/:username" element={<LegacyUserRedirect />} />
                  <Route path="/score/:username" element={<UserProfile />} />
                  <Route path="/instagram/:slug" element={<EntityProfile segment="instagram" />} />
                  <Route path="/tiktok/:slug" element={<EntityProfile segment="tiktok" />} />
                  <Route path="/x/:slug" element={<EntityProfile segment="x" />} />
                  <Route path="/twitter/:slug" element={<EntityProfile segment="twitter" />} />
                  <Route path="/phone/:slug" element={<EntityProfile segment="phone" />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/mod/login" element={<ModLogin />} />
                  <Route path="/mod" element={<ModDashboard />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </LinkPreviewProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
