// Parses pasted social media URLs (profile, post, reel/video) and extracts
// the platform + username. Used by the search bar so users can paste any
// social link and be redirected to the right Score entity page.
//
// Returns:
//   - `category`  → maps to one of our internal entity categories
//                   (instagram | tiktok | twitter). `null` when the URL
//                   is from a platform we recognize but don't host yet
//                   (telegram, youtube, facebook).
//   - `platform`  → human-readable platform label, always set.
//   - `username`  → normalized (lowercased, trimmed, no @, no trailing /).

import type { EntityCategory } from "./entitySlugs";

export interface ParsedSocialUrl {
  /** Internal entity category, when the platform has a Score entity page. */
  category: EntityCategory | null;
  /** "x" | "instagram" | "tiktok" | "telegram" | "youtube" | "facebook" */
  platform: string;
  /** Normalized username/handle (lowercase, no @, no slashes). */
  username: string;
}

const RESERVED = new Set([
  "explore",
  "reel",
  "reels",
  "p",
  "tv",
  "stories",
  "accounts",
  "direct",
  "i",
  "share",
  "home",
  "search",
  "video",
  "watch",
  "shorts",
  "channel",
  "c",
  "user",
  "@",
  "live",
  "discover",
  "trending",
  "foryou",
  "tag",
  "music",
  "hashtag",
]);

const stripHandle = (raw: string): string =>
  raw
    .trim()
    .replace(/^@+/, "")
    .replace(/\/+$/g, "")
    .toLowerCase();

const isLikelyUrl = (s: string): boolean =>
  /^(https?:\/\/|www\.)/i.test(s) ||
  /\b(x\.com|twitter\.com|instagram\.com|tiktok\.com|t\.me|telegram\.me|youtube\.com|youtu\.be|facebook\.com|fb\.com|fb\.me)\b/i.test(
    s,
  );

const ensureProtocol = (s: string): string =>
  /^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, "")}`;

const safeUrl = (s: string): URL | null => {
  try {
    return new URL(ensureProtocol(s.trim()));
  } catch {
    return null;
  }
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
  const path = url.pathname;

  // Instagram
  if (host === "instagram.com" || host.endsWith(".instagram.com")) {
    const seg = firstSegment(path);
    if (!seg) return null;
    // /p/<id>, /reel/<id>, /tv/<id>  →  next segment is sometimes the user,
    // but for these post-only URLs we cannot reliably derive the username
    // without an API call. Return null so the caller falls back to text search.
    if (RESERVED.has(seg)) return null;
    const username = stripHandle(seg);
    if (!username) return null;
    return { category: "instagram", platform: "instagram", username };
  }

  // TikTok
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    // /@username, /@username/video/123, /t/xxxx (short link — unresolvable)
    const seg = firstSegment(path);
    if (!seg) return null;
    if (seg.startsWith("@")) {
      const username = stripHandle(seg);
      if (!username) return null;
      return { category: "tiktok", platform: "tiktok", username };
    }
    if (RESERVED.has(seg) || seg === "t") return null;
    // Bare /username (rare but tolerated)
    return { category: "tiktok", platform: "tiktok", username: stripHandle(seg) };
  }

  // X / Twitter
  if (
    host === "x.com" ||
    host === "twitter.com" ||
    host.endsWith(".x.com") ||
    host.endsWith(".twitter.com")
  ) {
    const seg = firstSegment(path);
    if (!seg) return null;
    if (RESERVED.has(seg)) return null;
    return { category: "twitter", platform: "x", username: stripHandle(seg) };
  }

  // Telegram (no entity page yet → category null, falls back to text search)
  if (host === "t.me" || host === "telegram.me") {
    const seg = firstSegment(path);
    if (!seg || RESERVED.has(seg) || seg === "+") return null;
    return { category: null, platform: "telegram", username: stripHandle(seg) };
  }

  // YouTube
  if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") {
    const seg = firstSegment(path);
    if (!seg) return null;
    if (seg.startsWith("@")) {
      return { category: null, platform: "youtube", username: stripHandle(seg) };
    }
    if (seg === "c" || seg === "user" || seg === "channel") {
      const parts = path.split("/").filter(Boolean);
      const next = parts[1];
      if (!next) return null;
      return { category: null, platform: "youtube", username: stripHandle(decodeURIComponent(next)) };
    }
    return null;
  }

  // Facebook
  if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.com" || host === "fb.me") {
    const seg = firstSegment(path);
    if (!seg || RESERVED.has(seg)) return null;
    // /profile.php?id=123 → take id
    if (seg === "profile.php") {
      const id = url.searchParams.get("id");
      if (!id) return null;
      return { category: null, platform: "facebook", username: id };
    }
    return { category: null, platform: "facebook", username: stripHandle(seg) };
  }

  return null;
};

/** True when the string looks like a URL (used to decide whether to show a parse error). */
export const looksLikeUrl = isLikelyUrl;
