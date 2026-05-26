import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ExternalLink, Globe, RefreshCw, X } from "lucide-react";

/**
 * Harici link tıklandığında, link kendi sekmemizde tam ekran bir overlay
 * içinde iframe olarak açılır. Üst barda "needforscore'a dön" butonu
 * vardır — kullanıcı tek tıkla geri döner, hiç siteden ayrılmaz.
 *
 * Bazı siteler (X-Frame-Options / CSP) iframe içinde açılmayı engeller.
 * Bu durumda overlay yine açık kalır ve kullanıcıya "Yeni sekmede aç"
 * fallback'ı sunulur; geri dön butonu her zaman görünür.
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
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const open = useCallback((next: string) => {
    setUrl(next);
    setLoaded(false);
    setBlocked(false);
    setReloadKey((k) => k + 1);
  }, []);

  const close = useCallback(() => {
    setUrl(null);
    setLoaded(false);
    setBlocked(false);
  }, []);

  // ESC ile kapatma + scroll lock
  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [url, close]);

  // Embed engelleyen siteler için: 4 sn içinde load olmazsa fallback göster
  useEffect(() => {
    if (!url) return;
    const t = window.setTimeout(() => {
      if (!loaded) setBlocked(true);
    }, 4000);
    return () => window.clearTimeout(t);
  }, [url, loaded, reloadKey]);

  const host = url ? safeHostname(url) : "";

  return (
    <LinkPreviewCtx.Provider value={{ open }}>
      {children}
      {url && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-background animate-in fade-in-0"
          role="dialog"
          aria-modal="true"
          aria-label={`${host} önizlemesi`}
        >
          {/* Üst bar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background/95 backdrop-blur shrink-0">
            <button
              type="button"
              onClick={close}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:opacity-90 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">needforscore'a dön</span>
              <span className="xs:hidden sm:hidden">Geri</span>
            </button>
            <div className="flex items-center gap-1.5 min-w-0 flex-1 px-2">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs font-mono truncate text-muted-foreground">{host}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setLoaded(false);
                setBlocked(false);
                setReloadKey((k) => k + 1);
              }}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground"
              aria-label="Yenile"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="p-2 rounded-full hover:bg-muted text-muted-foreground"
              aria-label="Yeni sekmede aç"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={close}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* İçerik */}
          <div className="relative flex-1 bg-muted/30">
            <iframe
              key={reloadKey}
              ref={iframeRef}
              src={url}
              onLoad={() => setLoaded(true)}
              className="w-full h-full border-0 bg-background"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin"
              title={host}
            />
            {blocked && !loaded && (
              <div className="absolute inset-0 flex items-center justify-center p-6 bg-background/95">
                <div className="max-w-sm text-center space-y-4">
                  <Globe className="h-10 w-10 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Bu site önizlemeyi engelliyor</p>
                    <p className="text-sm text-muted-foreground mt-1 break-all">{host}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Yeni sekmede aç
                    </a>
                    <button
                      type="button"
                      onClick={close}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-border text-sm hover:bg-muted"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      needforscore'a dön
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </LinkPreviewCtx.Provider>
  );
};
