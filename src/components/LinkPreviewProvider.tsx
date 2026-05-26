import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { ArrowLeft, ExternalLink, Globe, RefreshCw, X } from "lucide-react";
import { detectEmbed, providerLabel, type EmbedDescriptor } from "@/lib/embedProviders";
import { supabase } from "@/integrations/supabase/client";

/**
 * In-app smart link preview. Two render modes:
 *
 *  1. Official embed (YouTube, Vimeo, Spotify, Twitch, Instagram, TikTok, X)
 *     → rendered inside an aspect-correct iframe using the platform's own
 *     embed endpoint. No raw page iframing, no X-Frame-Options surprises.
 *
 *  2. Rich card fallback → fetches OG/Twitter Card metadata via the
 *     `link-metadata` edge function and shows a premium card with hero
 *     image, title, description, favicon and an "Open externally" CTA.
 *
 * UI: fullscreen overlay on desktop, swipe-to-dismiss bottom sheet on
 * mobile. ESC to close, body-scroll lock, framer-motion transitions.
 */

type Ctx = { open: (url: string) => void };
const LinkPreviewCtx = createContext<Ctx | null>(null);

export const useLinkPreview = () => {
  const ctx = useContext(LinkPreviewCtx);
  if (!ctx) throw new Error("useLinkPreview must be used inside <LinkPreviewProvider>");
  return ctx;
};

const safeHostname = (url: string): string => {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
};

const useIsMobile = (): boolean => {
  const [mob, setMob] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 640px)").matches : false,
  );
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 640px)");
    const fn = (e: MediaQueryListEvent) => setMob(e.matches);
    mql.addEventListener("change", fn);
    return () => mql.removeEventListener("change", fn);
  }, []);
  return mob;
};

interface Meta {
  url: string;
  finalUrl: string;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  siteName: string | null;
}

const metaCache = new Map<string, Meta>();

const fetchMeta = async (url: string): Promise<Meta | null> => {
  if (metaCache.has(url)) return metaCache.get(url)!;
  try {
    const base = (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
    const anon = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ?? "";
    const res = await fetch(`${base}/functions/v1/link-metadata?url=${encodeURIComponent(url)}`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Meta;
    metaCache.set(url, data);
    return data;
  } catch {
    return null;
  }
};

interface EmbedFrameProps {
  embed: EmbedDescriptor;
  reloadKey: number;
}

const EmbedFrame = ({ embed, reloadKey }: EmbedFrameProps) => {
  // Aspect-correct container; iframe fills it.
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div
        className="w-full max-h-full"
        style={{ aspectRatio: `${embed.aspect}`, maxWidth: embed.kind === "social" || embed.aspect < 1 ? "min(420px, 100%)" : "100%" }}
      >
        <iframe
          key={reloadKey}
          src={embed.src}
          className="w-full h-full border-0 rounded-none sm:rounded-xl bg-black"
          allow={embed.allow}
          allowFullScreen={embed.allowFullScreen}
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-presentation"
          title={embed.title}
          loading="lazy"
        />
      </div>
    </div>
  );
};

interface FallbackCardProps {
  url: string;
  host: string;
}

const FallbackCard = ({ url, host }: FallbackCardProps) => {
  const [meta, setMeta] = useState<Meta | null>(metaCache.get(url) ?? null);
  const [loading, setLoading] = useState<boolean>(!metaCache.has(url));

  useEffect(() => {
    if (metaCache.has(url)) {
      setMeta(metaCache.get(url)!);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchMeta(url).then((m) => {
      if (cancelled) return;
      setMeta(m);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [url]);

  return (
    <div className="w-full h-full flex items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-background to-muted/40">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-md rounded-2xl overflow-hidden border border-border bg-card shadow-2xl"
      >
        <div className="aspect-[1.91/1] bg-muted relative overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/60 to-muted" />
          ) : meta?.image ? (
            <img
              src={meta.image}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Globe className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
        </div>
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {meta?.favicon && (
              <img
                src={meta.favicon}
                alt=""
                className="h-4 w-4 rounded-sm"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <span className="truncate font-mono">{meta?.siteName ?? host}</span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold leading-snug line-clamp-2">
            {loading ? <span className="inline-block h-4 w-3/4 bg-muted rounded animate-pulse" /> : meta?.title ?? host}
          </h3>
          {(loading || meta?.description) && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {loading ? <span className="inline-block h-3 w-full bg-muted rounded animate-pulse" /> : meta?.description}
            </p>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
          >
            <ExternalLink className="h-4 w-4" />
            Sitede aç
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export const LinkPreviewProvider = ({ children }: { children: ReactNode }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const isMobile = useIsMobile();
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);

  const open = useCallback((next: string) => {
    setUrl(next);
    setReloadKey((k) => k + 1);
  }, []);
  const close = useCallback(() => setUrl(null), []);

  const embed = useMemo(() => (url ? detectEmbed(url) : null), [url]);
  const host = url ? safeHostname(url) : "";

  // ESC + scroll lock
  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [url, close]);

  const titleLabel = embed ? providerLabel(embed.provider) : host;

  return (
    <LinkPreviewCtx.Provider value={{ open }}>
      {children}
      <AnimatePresence>
        {url && (
          <motion.div
            key="lp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex flex-col sm:items-center sm:justify-center sm:p-6"
            onClick={(e) => { if (e.target === e.currentTarget) close(); }}
            role="dialog"
            aria-modal="true"
            aria-label={`${titleLabel} önizlemesi`}
          >
            <motion.div
              ref={sheetRef}
              key="lp-sheet"
              initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.96 }}
              animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1 }}
              exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              drag={isMobile ? "y" : false}
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) close();
              }}
              className={
                isMobile
                  ? "mt-auto w-full h-[92svh] rounded-t-2xl bg-background border-t border-border shadow-2xl flex flex-col overflow-hidden"
                  : "w-full max-w-5xl h-[88vh] rounded-2xl bg-background border border-border shadow-2xl flex flex-col overflow-hidden"
              }
            >
              {/* Drag handle (mobile only) */}
              {isMobile && (
                <div
                  className="pt-2 pb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none"
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div className="h-1.5 w-12 rounded-full bg-muted-foreground/40" />
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background/95 backdrop-blur shrink-0">
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:opacity-90 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">needforscore'a dön</span>
                  <span className="sm:hidden">Geri</span>
                </button>
                <div className="flex items-center gap-1.5 min-w-0 flex-1 px-2">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs font-mono truncate text-muted-foreground">
                    {embed ? `${providerLabel(embed.provider)} · ${host}` : host}
                  </span>
                </div>
                {embed && (
                  <button
                    type="button"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="p-2 rounded-full hover:bg-muted text-muted-foreground"
                    aria-label="Yenile"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
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

              {/* Body */}
              <div className="relative flex-1 min-h-0 bg-background overflow-auto">
                {embed ? (
                  <EmbedFrame embed={embed} reloadKey={reloadKey} />
                ) : (
                  <FallbackCard url={url} host={host} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LinkPreviewCtx.Provider>
  );
};
