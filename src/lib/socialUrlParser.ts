// Parses pasted social media URLs (profile, post, reel/video) and extracts
// the platform + username. When the username cannot be derived from the URL
// shape alone (e.g. Instagram reel, TikTok short link, X status, YouTube
// short) the parser still recognizes the platform and sets `needsResolve`
// so the caller can fall back to the `resolve-social-url` edge function.

import type { EntityCategory } from "./entitySlugs";

export type SocialContentType =
  | "profile"
  | "reel"
  | "post"
  | "short"
  | "video"
  | "tweet"
  | "unknown";

export interface ParsedSocialUrl {
  /** Internal entity category, when the platform has a Score entity page. */
  category: EntityCategory | null;
  /** "x" | "instagram" | "tiktok" | "telegram" | "youtube" | "facebook" */
  platform: string;
  /** Normalized username. `null` when only the platform was detected. */
  username: string | null;
  /** Link type derived from URL shape. */
  contentType: SocialContentType;
  /** True when URL is recognized but username needs to be resolved server-side. */
  needsResolve: boolean;
}

const RESERVED = new Set([
  "explore", "reel", "reels", "p", "tv", "stories", "accounts", "direct", "i",
  "share", "home", "search", "video", "watch", "shorts", "channel", "c", "user",
  "@", "live", "discover", "trending", "foryou", "tag", "music", "hashtag",
  "status", "intent", "t",
]);

const stripHandle = (raw: string): string =>
  raw.trim().replace(/^@+/, "").replace(/\/+$/g, "").toLowerCase();

const isLikelyUrl = (s: string): boolean =>
  /^(https?:\/\/|www\.)/i.test(s) ||
  /\b(x\.com|twitter\.com|instagram\.com|tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com|t\.me|telegram\.me|youtube\.com|youtu\.be|facebook\.com|fb\.com|fb\.me)\b/i.test(
    s,
  );

const ensureProtocol = (s: string): string =>
  /^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, "")}`;

const safeUrl = (s: string): URL | null => {
  try { return new URL(ensureProtocol(s.trim())); } catch { return null; }
};

const firstSegment = (pathname: string): string | null => {
  const parts = pathname.split("/").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return decodeURIComponent(parts[0]);
};

export const parseSocialUrl = (input: string): ParsedSocialUrl | null => {
  if (!input) return null;
  const raw = input.trim();
  if (!isLikelyUrl(raw)) return null;

  const url = safeUrl(raw);
  if (!url) return null;
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const parts = url.pathname.split("/").map((p) => p.trim()).filter(Boolean);
  const seg = parts[0] ? decodeURIComponent(parts[0]) : null;

  // Instagram (covers instagram.com, www., m., l. and ddinstagram variants)
  if (host === "instagram.com" || host.endsWith(".instagram.com")) {
    if (!seg) return null;
    // /share/reel/<id> or /share/p/<id> — mobile share links
    if (seg === "share" && parts[1]) {
      const sub = parts[1];
      if (["reel", "reels", "p", "tv"].includes(sub)) {
        const ct: SocialContentType = sub === "p" ? "post" : sub === "tv" ? "video" : "reel";
        return { category: "instagram", platform: "instagram", username: null, contentType: ct, needsResolve: true };
      }
      // /share/<username>
      const username = stripHandle(sub);
      if (username && !RESERVED.has(username)) {
        return { category: "instagram", platform: "instagram", username, contentType: "profile", needsResolve: false };
      }
      return { category: "instagram", platform: "instagram", username: null, contentType: "unknown", needsResolve: true };
    }
    // /stories/<username>/<id> — username is right there in the URL
    if (seg === "stories" && parts[1]) {
      const username = stripHandle(decodeURIComponent(parts[1]));
      if (username && !RESERVED.has(username)) {
        return { category: "instagram", platform: "instagram", username, contentType: "profile", needsResolve: false };
      }
    }
    if (["reel", "reels", "p", "tv"].includes(seg)) {
      const ct: SocialContentType = seg === "p" ? "post" : seg === "tv" ? "video" : "reel";
      return { category: "instagram", platform: "instagram", username: null, contentType: ct, needsResolve: true };
    }
    if (RESERVED.has(seg)) return null;
    const username = stripHandle(seg);
    if (!username) return null;
    return { category: "instagram", platform: "instagram", username, contentType: "profile", needsResolve: false };
  }

  // TikTok short links
  if (host === "vm.tiktok.com" || host === "vt.tiktok.com") {
    return { category: "tiktok", platform: "tiktok", username: null, contentType: "video", needsResolve: true };
  }

  // TikTok
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    if (!seg) return null;
    if (seg.startsWith("@")) {
      const username = stripHandle(seg);
      if (!username) return null;
      const ct: SocialContentType = parts[1] === "video" ? "video" : "profile";
      return { category: "tiktok", platform: "tiktok", username, contentType: ct, needsResolve: false };
    }
    if (seg === "t") {
      return { category: "tiktok", platform: "tiktok", username: null, contentType: "video", needsResolve: true };
    }
    if (RESERVED.has(seg)) return null;
    return { category: "tiktok", platform: "tiktok", username: stripHandle(seg), contentType: "profile", needsResolve: false };
  }

  // X / Twitter
  if (host === "x.com" || host === "twitter.com" || host.endsWith(".x.com") || host.endsWith(".twitter.com")) {
    if (!seg) return null;
    if (seg === "i" || seg === "intent" || seg === "search") {
      // /i/status/<id> — username must be resolved
      return { category: "twitter", platform: "x", username: null, contentType: "tweet", needsResolve: true };
    }
    if (RESERVED.has(seg)) return null;
    const username = stripHandle(seg);
    const ct: SocialContentType = parts[1] === "status" ? "tweet" : "profile";
    return { category: "twitter", platform: "x", username, contentType: ct, needsResolve: false };
  }

  // Telegram
  if (host === "t.me" || host === "telegram.me") {
    if (!seg || RESERVED.has(seg) || seg === "+") return null;
    return { category: null, platform: "telegram", username: stripHandle(seg), contentType: "profile", needsResolve: false };
  }

  // YouTube
  if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "m.youtube.com") {
    if (!seg) return null;
    if (seg.startsWith("@")) {
      return { category: null, platform: "youtube", username: stripHandle(seg), contentType: "profile", needsResolve: false };
    }
    if (seg === "shorts") {
      return { category: null, platform: "youtube", username: null, contentType: "short", needsResolve: true };
    }
    if (seg === "watch") {
      return { category: null, platform: "youtube", username: null, contentType: "video", needsResolve: true };
    }
    if (["c", "user", "channel"].includes(seg) && parts[1]) {
      return { category: null, platform: "youtube", username: stripHandle(decodeURIComponent(parts[1])), contentType: "profile", needsResolve: false };
    }
    return null;
  }
  if (host === "youtu.be") {
    return { category: null, platform: "youtube", username: null, contentType: "video", needsResolve: true };
  }

  // Facebook
  if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.com" || host === "fb.me") {
    if (!seg || RESERVED.has(seg)) return null;
    if (seg === "profile.php") {
      const id = url.searchParams.get("id");
      if (!id) return null;
      return { category: null, platform: "facebook", username: id, contentType: "profile", needsResolve: false };
    }
    return { category: null, platform: "facebook", username: stripHandle(seg), contentType: "profile", needsResolve: false };
  }

  return null;
};

/** True when the string looks like a URL (used to decide whether to show a parse error). */
export const looksLikeUrl = isLikelyUrl;
