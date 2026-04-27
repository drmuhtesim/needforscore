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
import NotFound from "./pages/NotFound.tsx";
import UsernameOnboarding from "./pages/UsernameOnboarding.tsx";

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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding/username" element={<UsernameOnboarding />} />
            <Route path="/e/:id" element={<EntryDetail />} />
            <Route path="/u/:username" element={<UserProfile />} />
            <Route path="/messages" element={<Messages />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
