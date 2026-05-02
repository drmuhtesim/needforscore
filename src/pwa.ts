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

  // Mevcut registration varsa update'i zorla — kill-switch SW devreye girsin
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => {
      regs.forEach((r) => {
        r.update().catch(() => {});
      });
    })
    .catch(() => {});
}
