import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { ThemeProvider } from "./contexts/ThemeContext";
import { registerSW } from "./pwa";
import { startVersionCheck } from "./lib/versionCheck";

// Register service worker for PWA (production only, not in preview/iframe)
registerSW();

// Watch for new deploys and prompt user to refresh
startVersionCheck();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
);
