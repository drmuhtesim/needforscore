import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { ThemeProvider } from "./contexts/ThemeContext";
import { registerSW } from "./pwa";
import { startVersionCheck } from "./lib/versionCheck";
import { registerOAuthDeepLinkHandler } from "./lib/nativeAuth";

registerSW();
startVersionCheck();
// Native (iOS/Android) only — no-op on web.
registerOAuthDeepLinkHandler(() => {
  // After a successful native OAuth round-trip, jump to the app root so the
  // AuthProvider picks up the new session and onboarding/redirects kick in.
  if (window.location.pathname.startsWith("/auth")) {
    window.location.replace("/");
  }
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </HelmetProvider>,
);
