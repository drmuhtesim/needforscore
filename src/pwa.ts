/**
 * Service worker registration is INTENTIONALLY DISABLED.
 *
 * Daha önce shipped bir SW vardı ve Safari'de eski cache'leri agresifçe
 * sunuyordu. Şimdi /sw.js bir kill-switch worker — tarayıcı onu fetch
 * ettiğinde tüm cache'leri silip kendini unregister ediyor.
 *
 * Yeni bir SW register ETMİYORUZ. Bu fonksiyon sadece daha önce kalmış
 * registration varsa (kill-switch update'iyle) güncellenmesini tetikler.
 */
export function registerSW() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  void clearServiceWorkerCache({ reload: false });

  if (isPreviewOrIframe()) return;
  if (localStorage.getItem("score-sw-cleanup-version") === "2026-05-04-v2") return;
  localStorage.setItem("score-sw-cleanup-version", "2026-05-04-v2");

  // Eski cihazlarda farklı path ile register edilmiş SW olabilir.
  // İki kill-switch dosyasını da kısa süreli register ederek Safari'nin
  // eski offline cache'lerini temizlemesini garanti ederiz; worker kendini siler.
  ["/sw.js", "/service-worker.js"].forEach((path) => {
    navigator.serviceWorker.register(path).catch(() => {});
  });
}

export async function clearServiceWorkerCache(options: { reload?: boolean } = {}) {
  if (typeof window === "undefined") return;

  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        regs.map(async (r) => {
          try {
            r.active?.postMessage({ type: "SCORE_CLEAR_CACHE" });
            await r.update();
          } catch {
            // no-op
          }
          try {
            await r.unregister();
          } catch {
            // no-op
          }
        })
      );
    }

    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
  } catch {
    // no-op — cache temizliği en iyi-effort çalışır
  }

  if (options.reload) {
    const url = new URL(window.location.href);
    url.searchParams.set("cache-reset", Date.now().toString());
    window.location.replace(url.toString());
  }
}

function isPreviewOrIframe(): boolean {
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }

  const h = window.location.hostname;
  return h.includes("id-preview--") || h.includes("lovableproject.com") || h === "localhost" || h === "127.0.0.1";
}
