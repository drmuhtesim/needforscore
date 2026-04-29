import { toast } from "sonner";
import i18n from "@/i18n";

/**
 * Yeni deploy tespiti.
 *
 * Mantık: index.html'i cache atlayarak fetch ederiz, içindeki
 * <script type="module" src="/assets/index-XXXX.js"> hash'ini parse ederiz.
 * İlk değer baseline olur; sonraki check'te farklıysa yeni deploy var demektir.
 */

const CHECK_INTERVAL_MS = 60_000; // 1 dakikada bir
const HTML_URL = "/index.html";

let baselineHash: string | null = null;
let notified = false;
let timer: number | null = null;

function isPreviewOrIframe(): boolean {
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const h = window.location.hostname;
  return (
    h.includes("id-preview--") ||
    h.includes("lovableproject.com") ||
    h.includes("lovable.app") ||
    h === "localhost" ||
    h === "127.0.0.1"
  );
}

async function fetchAppHash(): Promise<string | null> {
  try {
    const res = await fetch(`${HTML_URL}?_v=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Tüm /assets/...-HASH.(js|css) referanslarını topla → birleştirip imza üret.
    const matches = html.match(/\/assets\/[^"'\s]+\.(?:js|css)/g);
    if (!matches || matches.length === 0) return null;
    return matches.sort().join("|");
  } catch {
    return null;
  }
}

function showUpdateToast() {
  if (notified) return;
  notified = true;

  const t = i18n.t.bind(i18n);
  toast(t("update.title", { defaultValue: "Yeni sürüm hazır" }), {
    description: t("update.description", {
      defaultValue: "Sayfayı yenileyerek son güncellemeleri al.",
    }),
    duration: Infinity,
    action: {
      label: t("update.action", { defaultValue: "Yenile" }),
      onClick: () => {
        // Service worker varsa eski cache'i temizle, sonra reload
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then((regs) => {
            Promise.all(regs.map((r) => r.update())).finally(() => {
              window.location.reload();
            });
          });
        } else {
          window.location.reload();
        }
      },
    },
  });
}

async function check() {
  if (document.visibilityState !== "visible") return;
  const current = await fetchAppHash();
  if (!current) return;

  if (baselineHash === null) {
    baselineHash = current;
    return;
  }
  if (current !== baselineHash) {
    showUpdateToast();
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }
}

export function startVersionCheck() {
  if (typeof window === "undefined") return;
  if (isPreviewOrIframe()) return;

  // İlk baseline'ı yakala
  void check();

  timer = window.setInterval(() => {
    void check();
  }, CHECK_INTERVAL_MS);

  // Sekme tekrar görünür olduğunda da kontrol et
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void check();
  });

  // Online olunca da kontrol et
  window.addEventListener("online", () => {
    void check();
  });
}
