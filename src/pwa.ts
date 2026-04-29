import { toast } from "sonner";
import i18n from "@/i18n";

export function registerSW() {
  if (!("serviceWorker" in navigator)) return;

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const isPreviewHost =
    window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("lovable.app");

  if (isPreviewHost || isInIframe) {
    // Preview/iframe: unregister any leftover SW + clear caches so editor always shows latest
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => {
        // Check for updates immediately and periodically
        registration.update().catch(() => {});
        setInterval(() => registration.update().catch(() => {}), 60_000);

        // Detect a new worker installing
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New version available — prompt user to refresh
              promptRefresh(newWorker);
            }
          });
        });
      })
      .catch(() => {
        /* SW registration failed — non-fatal */
      });

    // When the new SW takes control, reload once so the user sees the new build
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}

function promptRefresh(worker: ServiceWorker) {
  const t = i18n.t.bind(i18n);
  toast(t("update.title", { defaultValue: "Yeni sürüm hazır" }), {
    description: t("update.description", {
      defaultValue: "Sayfayı yenileyerek son güncellemeleri al.",
    }),
    duration: Infinity,
    action: {
      label: t("update.action", { defaultValue: "Yenile" }),
      onClick: () => {
        worker.postMessage({ type: "SKIP_WAITING" });
      },
    },
  });
}
