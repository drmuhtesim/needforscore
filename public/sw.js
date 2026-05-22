self.__SCORE_SW_CLEANUP_VERSION__ = "__BUILD_ID__";

/**
 * KILL-SWITCH SERVICE WORKER
 *
 * Eski SW kayıtlarını temizler:
 *   1) Tüm cache'leri siler
 *   2) Kendini unregister eder
 *
 * Açık sekmeleri YENİDEN YÜKLEMEZ — bu, "ilk açılışta sayfa açılmıyor,
 * refresh atınca düzeliyor" hissi yaratıyordu. Yeni asset'ler zaten
 * sonraki navigation'da ağdan gelecek.
 */

self.addEventListener("install", (event) => {
  // @ts-ignore
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
        // @ts-ignore
        await self.clients.claim();
        // @ts-ignore
        await self.registration.unregister();
      } catch {
        // sessizce geç
      }
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "SCORE_CLEAR_CACHE") return;
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
      // @ts-ignore
      await self.registration.unregister();
    })()
  );
});

// Hiçbir fetch'i intercept etme — her şey ağa gitsin
self.addEventListener("fetch", () => {});
