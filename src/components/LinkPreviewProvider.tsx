import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ExternalLink, Globe } from "lucide-react";

/**
 * Tek tıkla davranış:
 *   - Harici link tıklanır tıklanmaz yeni sekmede açılır (window.open).
 *   - Aynı anda needforscore tarafında küçük bir alt-banner gösterilir:
 *     "Bağlantı yeni sekmede açıldı · needforscore'a dön".
 *   - "Geri dön" butonu banner'ı kapatır; kullanıcı zaten needforscore
 *     sekmesindedir, yeni sekmeyi kapatmasıyla geri dönüş tamamlanır.
 *
 * Eski iframe önizleme sheet'i kaldırıldı — kullanıcılar artık çift tıklamak
 * zorunda değil ve embed engelleyen sitelerde boş iframe görmüyor.
 */
type Ctx = { open: (url: string) => void };
const LinkPreviewCtx = createContext<Ctx | null>(null);

export const useLinkPreview = () => {
  const ctx = useContext(LinkPreviewCtx);
  if (!ctx) throw new Error("useLinkPreview must be used inside <LinkPreviewProvider>");
  return ctx;
};

const safeHostname = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export const LinkPreviewProvider = ({ children }: { children: ReactNode }) => {
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  const open = useCallback((next: string) => {
    try {
      window.open(next, "_blank", "noopener,noreferrer");
    } catch {
      window.location.href = next;
      return;
    }
    setLastUrl(next);
  }, []);

  const dismiss = useCallback(() => setLastUrl(null), []);

  // 8 saniye sonra otomatik kapan
  useEffect(() => {
    if (!lastUrl) return;
    const t = window.setTimeout(() => setLastUrl(null), 8000);
    return () => window.clearTimeout(t);
  }, [lastUrl]);

  const host = lastUrl ? safeHostname(lastUrl) : "";

  return (
    <LinkPreviewCtx.Provider value={{ open }}>
      {children}
      {lastUrl && (
        <div
          className="fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4 pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-background/95 backdrop-blur shadow-xl pl-3 pr-1 py-1 animate-in fade-in-0 slide-in-from-bottom-4 max-w-[95vw]">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex flex-col leading-tight">
              <span className="text-[11px] text-muted-foreground">Yeni sekmede açıldı</span>
              <span className="text-xs font-mono truncate max-w-[40vw] sm:max-w-xs">{host}</span>
            </div>
            <a
              href={lastUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-muted-foreground hover:text-foreground"
              aria-label="Bağlantıyı tekrar aç"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              needforscore'a dön
            </button>
          </div>
        </div>
      )}
    </LinkPreviewCtx.Provider>
  );
};
