/**
 * KILL-SWITCH SERVICE WORKER
 *
 * Bu dosya, daha önce kayıtlı olan eski service worker'ları
 * cihazlardan temizlemek için var. Yaptıkları:
 *   1) Tüm cache'leri siler
 *   2) Açık tüm sekmeleri cache-bust query ile yeniden yükler
 *   3) Kendini unregister eder
 *
 * Yeni cache YAPMAZ, fetch'leri INTERCEPT etmez.
 * Safari dahil tüm tarayıcılar artık her zaman ağdan taze HTML/asset alır.
 */

self.addEventListener("install", (event) => {
  // @ts-ignore
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        // 1) Tüm cache'leri sil
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));

        // 2) Tüm istemcileri ele al
        // @ts-ignore
        await self.clients.claim();

        // 3) Açık sekmeleri taze URL ile yeniden yükle
        // @ts-ignore
        const clients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        await Promise.all(
          clients.map((c) => {
            try {
              const url = new URL(c.url);
              url.searchParams.set("sw-cleanup", Date.now().toString());
              // @ts-ignore
              return c.navigate(url.toString());
            } catch {
              return Promise.resolve();
            }
          })
        );

        // 4) Kendini unregister et — bir daha bu cihazda SW olmayacak
        // @ts-ignore
        await self.registration.unregister();
      } catch {
        // sessizce geç — kötü bir şey olmasın
      }
    })()
  );
});

// Hiçbir fetch'i intercept etme — her şey ağa gitsin
self.addEventListener("fetch", () => {});
