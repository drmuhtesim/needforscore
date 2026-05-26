import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ExternalLink, X, RotateCw, Globe } from "lucide-react";

/**
 * In-app link preview, à la Twitter/X mobile browser.
 *
 * Opens external URLs in a bottom sheet with an attempted <iframe> embed.
 * Many social sites (Instagram, X, TikTok) block embedding via X-Frame-Options /
 * frame-ancestors CSP — in that case the iframe stays blank and the user
 * can tap "Yeni sekmede aç" to fall back to a real navigation.
 *
 * Internal links (same-origin) are NOT intercepted — those should keep using
 * react-router <Link>.
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
  const [iframeKey, setIframeKey] = useState(0);

  const open = useCallback((next: string) => {
    setUrl(next);
    setIframeKey((k) => k + 1);
  }, []);

  const close = useCallback(() => setUrl(null), []);

  // Esc to close
  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [url, close]);

  const host = url ? safeHostname(url) : "";

  return (
    <LinkPreviewCtx.Provider value={{ open }}>
      {children}
      {url && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center"
          role="dialog"
          aria-modal="true"
        >
          {/* Overlay */}
          <button
            type="button"
            aria-label="Kapat"
            onClick={close}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in-0"
          />

          {/* Sheet */}
          <div
            className={
              "relative w-full sm:max-w-2xl h-[92vh] sm:h-[85vh] bg-background border-t sm:border border-border shadow-2xl " +
              "rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col " +
              "animate-in slide-in-from-bottom-4 sm:zoom-in-95"
            }
          >
            {/* Grab handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-2 pb-1">
              <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card">
              <button
                onClick={close}
                className="p-1.5 rounded-full hover:bg-secondary transition-colors"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1 rounded-full bg-secondary/60">
                <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-mono text-foreground/80 truncate">{host}</span>
              </div>
              <button
                onClick={() => setIframeKey((k) => k + 1)}
                className="p-1.5 rounded-full hover:bg-secondary transition-colors"
                aria-label="Yenile"
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
              >
                Aç <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Iframe */}
            <div className="relative flex-1 bg-muted/30">
              <iframe
                key={iframeKey}
                src={url}
                title={host}
                className="absolute inset-0 h-full w-full bg-background"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              {/* Fallback hint shown behind iframe — if site blocks embed,
                  iframe renders blank and this message is visible. */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center">
                <div className="max-w-xs space-y-3 text-sm text-muted-foreground">
                  <p>
                    Bu site önizlemeye izin vermiyor olabilir. Açmak için{" "}
                    <span className="text-foreground font-semibold">Aç</span> butonuna dokun.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </LinkPreviewCtx.Provider>
  );
};
