import type { CategoryType } from "@/components/CategorySidebar";
import { cleanTarget } from "@/lib/platforms";

/**
 * Central deep-link / direct-open helper.
 *
 * Goal: one tap takes the user straight to the destination — the native app
 * when it is installed, the web profile otherwise. No in-app browser, no
 * intermediate confirmation screens.
 *
 * Strategy: try the platform's custom URL scheme first (mobile only) and fall
 * back to the https URL after a short timeout. If the app opens, the page is
 * backgrounded and the timer never fires visibly; if it does not, the user
 * lands on the web version.
 */

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "mc_cid",
  "mc_eid",
  "igshid",
  "igsh",
  "si",
  "ref_src",
  "ref_url",
];

const SAFE_PROTOCOLS = new Set(["http:", "https:", "tel:", "mailto:"]);

export const isMobileDevice = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(navigator.userAgent);
};

const isIOS = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
};

/** Add https:// when the user typed a bare domain. */
export const ensureProtocol = (raw: string): string => {
  const trimmed = raw.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
};

/** Strip tracking/campaign params without touching the target itself. */
export const cleanUrl = (raw: string): string | null => {
  try {
    const u = new URL(ensureProtocol(raw));
    if (!SAFE_PROTOCOLS.has(u.protocol)) return null;
    if (u.protocol === "http:" || u.protocol === "https:") {
      for (const p of TRACKING_PARAMS) {
        u.searchParams.delete(p);
      }
    }
    return u.toString();
  } catch {
    return null;
  }
};

export const isSameOriginUrl = (raw: string): boolean => {
  if (typeof window === "undefined") return false;
  if (raw.startsWith("/")) return true;
  try {
    return new URL(raw, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
};

/** Open an https URL in a new tab, safely. */
const openWeb = (url: string): void => {
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (win) win.opener = null;
  else window.location.href = url; // popup blocked → same-tab navigation
};

/**
 * Try a native app scheme, fall back to the web URL if nothing handled it.
 * On iOS we use a hidden iframe (Safari suppresses the scheme error dialog);
 * on Android we set location directly.
 */
const openWithScheme = (scheme: string, webUrl: string): void => {
  let handled = false;
  const onHide = () => {
    if (document.hidden) handled = true;
  };
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", onHide);

  const cleanup = () => {
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", onHide);
  };

  if (isIOS()) {
    const frame = document.createElement("iframe");
    frame.style.display = "none";
    frame.src = scheme;
    document.body.appendChild(frame);
    window.setTimeout(() => frame.remove(), 1200);
  } else {
    try {
      window.location.href = scheme;
    } catch {
      /* unsupported scheme */
    }
  }

  window.setTimeout(() => {
    cleanup();
    if (!handled && !document.hidden) openWeb(webUrl);
  }, 900);
};

/** Platform detected from an arbitrary URL. */
type Platform = "instagram" | "tiktok" | "twitter" | "whatsapp" | "phone" | "web";

const detectPlatform = (url: string): { platform: Platform; handle?: string; isProfilePath: boolean } => {
  try {
    const u = new URL(ensureProtocol(url));
    if (u.protocol === "tel:") return { platform: "phone", handle: u.pathname, isProfilePath: true };
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const seg = u.pathname.split("/").filter(Boolean);
    // Only a single-segment path is a plain profile (e.g. x.com/user).
    // Deeper paths (status/video/reel/…) point at specific content and must
    // keep the full URL so the destination post opens, not the profile.
    const isProfilePath = seg.length === 1;
    if (host.endsWith("instagram.com")) return { platform: "instagram", handle: seg[0], isProfilePath };
    if (host.endsWith("tiktok.com")) return { platform: "tiktok", handle: seg[0]?.replace(/^@/, ""), isProfilePath };
    if (host === "x.com" || host.endsWith("twitter.com")) return { platform: "twitter", handle: seg[0], isProfilePath };
    if (host === "wa.me" || host.endsWith("whatsapp.com")) return { platform: "whatsapp", handle: seg[0], isProfilePath };
    return { platform: "web", isProfilePath: false };
  } catch {
    return { platform: "web", isProfilePath: false };
  }
};

/** Public web URL for a platform handle. */
export const webProfileUrl = (
  handle: string,
  category: Exclude<CategoryType, "all">,
): string | null => {
  const h = cleanTarget(handle);
  switch (category) {
    case "instagram":
      return `https://www.instagram.com/${h}/`;
    case "tiktok":
      return `https://www.tiktok.com/@${h}`;
    case "twitter":
      return `https://x.com/${h}`;
    case "score":
      return `/score/${h.toLowerCase()}`;
    case "phone":
      return `tel:${h.replace(/[^\d+]/g, "")}`;
    default:
      return null;
  }
};

/**
 * Open a platform target (Instagram/TikTok/X handle, phone number) directly.
 * Returns false when the target can't be resolved into a destination.
 */
export const openTarget = (
  rawTarget: string,
  category: Exclude<CategoryType, "all">,
): boolean => {
  const handle = cleanTarget(rawTarget);
  if (!handle) return false;

  if (category === "phone") {
    const digits = handle.replace(/[^\d+]/g, "");
    if (digits.replace(/\D/g, "").length < 7) return false;
    // Opens the dialer pre-filled; the user still has to press call.
    window.location.href = `tel:${digits}`;
    return true;
  }

  if (category === "score") {
    // Internal Score profile — normal in-app navigation, handled by caller.
    return false;
  }

  const web = webProfileUrl(handle, category);
  if (!web) return false;

  if (!isMobileDevice()) {
    openWeb(web);
    return true;
  }

  switch (category) {
    case "instagram":
      openWithScheme(`instagram://user?username=${encodeURIComponent(handle)}`, web);
      return true;
    case "tiktok":
      openWithScheme(`snssdk1233://user/profile/${encodeURIComponent(handle)}`, web);
      return true;
    case "twitter":
      openWithScheme(`twitter://user?screen_name=${encodeURIComponent(handle)}`, web);
      return true;
    default:
      openWeb(web);
      return true;
  }
};

/**
 * Open any external URL directly — native app when possible, browser otherwise.
 * Same-origin URLs are rejected (caller should route them in-app instead).
 */
export const openExternalUrl = (rawUrl: string): boolean => {
  const url = cleanUrl(rawUrl);
  if (!url) return false;
  if (isSameOriginUrl(url)) return false;

  if (url.startsWith("tel:") || url.startsWith("mailto:")) {
    window.location.href = url;
    return true;
  }

  const { platform, handle } = detectPlatform(url);

  if (!isMobileDevice()) {
    openWeb(url);
    return true;
  }

  switch (platform) {
    case "instagram":
      if (handle && !["p", "reel", "reels", "tv", "stories", "explore"].includes(handle)) {
        openWithScheme(`instagram://user?username=${encodeURIComponent(handle)}`, url);
      } else {
        openWithScheme(`instagram://media?url=${encodeURIComponent(url)}`, url);
      }
      return true;
    case "tiktok":
      if (handle) openWithScheme(`snssdk1233://user/profile/${encodeURIComponent(handle)}`, url);
      else openWeb(url);
      return true;
    case "twitter":
      if (handle && !["i", "home", "search", "status"].includes(handle)) {
        openWithScheme(`twitter://user?screen_name=${encodeURIComponent(handle)}`, url);
      } else {
        openWeb(url);
      }
      return true;
    case "whatsapp":
      if (handle && /^\d+$/.test(handle)) openWithScheme(`whatsapp://send?phone=${handle}`, url);
      else openWeb(url);
      return true;
    default:
      openWeb(url);
      return true;
  }
};
