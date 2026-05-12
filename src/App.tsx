import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import EntryDetail from "./pages/EntryDetail.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import Messages from "./pages/Messages.tsx";
import NotificationsPage from "./pages/NotificationsPage.tsx";
import Terms from "./pages/Terms.tsx";
import Privacy from "./pages/Privacy.tsx";
import NotFound from "./pages/NotFound.tsx";
import UsernameOnboarding from "./pages/UsernameOnboarding.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import EntityProfile from "./pages/EntityProfile.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import { HelmetProvider } from "react-helmet-async";

const queryClient = new QueryClient();

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
          <ErrorBoundary label="App">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding/username" element={<UsernameOnboarding />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/e/:id" element={<EntryDetail />} />
              <Route path="/u/:username" element={<UserProfile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
