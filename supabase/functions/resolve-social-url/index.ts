// Resolves a social media URL (Instagram reel/post, TikTok video, X tweet,
// YouTube short/video) to the content owner's username + platform.
//
// Strategy:
// 1. Try to parse the username directly from URL shape.
// 2. Fall back to Firecrawl scrape (JSON extraction prompt) to read the
//    page's owner from OG / meta tags.
//
// Public endpoint. No auth required.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Platform = "instagram" | "tiktok" | "twitter" | "youtube";
type Category = "instagram" | "tiktok" | "twitter" | null;

interface ResolveResult {
  platform: Platform | null;
  category: Category;
  username: string | null;
  contentType: "profile" | "reel" | "post" | "short" | "video" | "tweet" | "unknown";
  source: "url" | "metadata" | "none";
}

const RESERVED = new Set([
  "explore", "reel", "reels", "p", "tv", "stories", "accounts", "direct", "i",
  "share", "home", "search", "video", "watch", "shorts", "channel", "c", "user",
  "live", "discover", "trending", "foryou", "tag", "music", "hashtag", "t",
  "status", "i", "intent",
]);

const stripHandle = (raw: string) =>
  raw.trim().replace(/^@+/, "").replace(/\/+$/g, "").toLowerCase();

const ensureProtocol = (s: string) =>
  /^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, "")}`;

function quickParse(input: string): ResolveResult | null {
  let u: URL;
  try { u = new URL(ensureProtocol(input.trim())); } catch { return null; }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  const parts = u.pathname.split("/").map((p) => p.trim()).filter(Boolean);
  const seg0 = parts[0] ? decodeURIComponent(parts[0]) : null;

  // Instagram (covers instagram.com, www., m., l.)
  if (host === "instagram.com" || host.endsWith(".instagram.com")) {
    if (!seg0) return null;
    if (seg0 === "share" && parts[1]) {
      const sub = parts[1];
      if (["reel", "reels", "p", "tv"].includes(sub)) {
        return { platform: "instagram", category: "instagram", username: null,
          contentType: sub === "p" ? "post" : sub === "tv" ? "video" : "reel", source: "none" };
      }
      const username = stripHandle(sub);
      if (username && !RESERVED.has(username)) {
        return { platform: "instagram", category: "instagram", username, contentType: "profile", source: "url" };
      }
    }
    if (seg0 === "stories" && parts[1]) {
      const username = stripHandle(decodeURIComponent(parts[1]));
      if (username && !RESERVED.has(username)) {
        return { platform: "instagram", category: "instagram", username, contentType: "profile", source: "url" };
      }
    }
    if (["reel", "reels", "p", "tv"].includes(seg0)) {
      return { platform: "instagram", category: "instagram", username: null,
        contentType: seg0 === "p" ? "post" : seg0 === "tv" ? "video" : "reel", source: "none" };
    }
    if (RESERVED.has(seg0)) return null;
    return { platform: "instagram", category: "instagram", username: stripHandle(seg0),
      contentType: "profile", source: "url" };
  }

  // TikTok
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    if (!seg0) return null;
    if (seg0.startsWith("@")) {
      return { platform: "tiktok", category: "tiktok", username: stripHandle(seg0),
        contentType: parts[1] === "video" ? "video" : "profile", source: "url" };
    }
    if (seg0 === "t" || RESERVED.has(seg0)) {
      return { platform: "tiktok", category: "tiktok", username: null,
        contentType: "video", source: "none" };
    }
  }
  if (host === "vm.tiktok.com" || host === "vt.tiktok.com") {
    return { platform: "tiktok", category: "tiktok", username: null,
      contentType: "video", source: "none" };
  }

  // X / Twitter
  if (host === "x.com" || host === "twitter.com" || host.endsWith(".x.com") || host.endsWith(".twitter.com")) {
    if (!seg0) return null;
    if (RESERVED.has(seg0)) return { platform: "twitter", category: "twitter", username: null, contentType: "tweet", source: "none" };
    return { platform: "twitter", category: "twitter", username: stripHandle(seg0),
      contentType: parts[1] === "status" ? "tweet" : "profile", source: "url" };
  }

  // YouTube
  if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be" || host === "m.youtube.com") {
    if (host === "youtu.be") {
      return { platform: "youtube", category: null, username: null, contentType: "video", source: "none" };
    }
    if (!seg0) return null;
    if (seg0.startsWith("@")) {
      return { platform: "youtube", category: null, username: stripHandle(seg0), contentType: "profile", source: "url" };
    }
    if (seg0 === "shorts") {
      return { platform: "youtube", category: null, username: null, contentType: "short", source: "none" };
    }
    if (seg0 === "watch" || seg0 === "v") {
      return { platform: "youtube", category: null, username: null, contentType: "video", source: "none" };
    }
    if (["c", "user", "channel"].includes(seg0) && parts[1]) {
      return { platform: "youtube", category: null, username: stripHandle(decodeURIComponent(parts[1])),
        contentType: "profile", source: "url" };
    }
  }

  return null;
}

async function fetchMetadata(url: string): Promise<string | null> {
  // Strategy 1: direct fetch with a desktop UA — works for X, YouTube
  // and sometimes Instagram. Cheap, no Firecrawl credits used.
  try {
    const r = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (r.ok) {
      const text = await r.text();
      if (text && text.length > 500) return text;
    }
  } catch (_) { /* fall through */ }

  // Strategy 2: Firecrawl (bypasses anti-bot for IG/TikTok).
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) return null;
  try {
    const r = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["html", "rawHtml"], onlyMainContent: false }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data?.data?.html ?? data?.html ?? data?.data?.rawHtml ?? data?.rawHtml ?? null;
  } catch (_) {
    return null;
  }
}

function extractUsername(html: string, platform: Platform): string | null {
  // Look for og:url / canonical / twitter:creator first — most reliable.
  const ogUrl = /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1]
    ?? /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:url["']/i.exec(html)?.[1]
    ?? /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i.exec(html)?.[1];

  if (ogUrl) {
    const parsed = quickParse(ogUrl);
    if (parsed?.username) return parsed.username;
  }

  if (platform === "twitter") {
    const m = /<meta[^>]+name=["']twitter:creator["'][^>]+content=["']@?([^"']+)["']/i.exec(html);
    if (m) return stripHandle(m[1]);
    // Also try the title: "Name (@handle) on X"
    const t = /\(@([A-Za-z0-9_]{1,15})\)\s+on\s+X/i.exec(html);
    if (t) return t[1].toLowerCase();
  }

  if (platform === "instagram") {
    // og:title is usually: "Username on Instagram: ..." or "User Name (@username) ..."
    const ogTitle = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1];
    if (ogTitle) {
      const a = /\(@([A-Za-z0-9_.]+)\)/.exec(ogTitle);
      if (a) return a[1].toLowerCase();
      const b = /^([A-Za-z0-9_.]+)\s+on\s+Instagram/i.exec(ogTitle);
      if (b) return b[1].toLowerCase();
    }
    // JSON-LD author
    const ld = /"author"\s*:\s*\{[^}]*"alternateName"\s*:\s*"@?([A-Za-z0-9_.]+)"/i.exec(html);
    if (ld) return ld[1].toLowerCase();
  }

  if (platform === "tiktok") {
    // og:url usually contains /@username/video/...
    // JSON SIGI_STATE includes uniqueId
    const m = /"uniqueId"\s*:\s*"([A-Za-z0-9_.]+)"/.exec(html);
    if (m) return m[1].toLowerCase();
    const t = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1];
    if (t) {
      const a = /\(@([A-Za-z0-9_.]+)\)/.exec(t);
      if (a) return a[1].toLowerCase();
    }
  }

  if (platform === "youtube") {
    const m = /"ownerChannelName"\s*:\s*"([^"]+)"/.exec(html)
      ?? /"author"\s*:\s*"([^"]+)"/.exec(html);
    if (m) {
      // Try to find handle nearby
      const h = /"channelHandleText"\s*:\s*\{[^}]*"simpleText"\s*:\s*"@([A-Za-z0-9_.-]+)"/.exec(html)
        ?? /"webCommandMetadata"\s*:\s*\{[^}]*"url"\s*:\s*"\/@([A-Za-z0-9_.-]+)"/.exec(html);
      if (h) return h[1].toLowerCase();
      return m[1].toLowerCase().replace(/\s+/g, "");
    }
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { url } = await req.json().catch(() => ({ url: null }));
    if (!url || typeof url !== "string" || url.length > 2048) {
      return new Response(JSON.stringify({ error: "Invalid url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const initial = quickParse(url);
    if (initial?.username) {
      return new Response(JSON.stringify(initial), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!initial || !initial.platform) {
      return new Response(JSON.stringify({
        platform: null, category: null, username: null,
        contentType: "unknown", source: "none",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Need to resolve via metadata
    const html = await fetchMetadata(ensureProtocol(url));
    if (!html) {
      return new Response(JSON.stringify(initial), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const username = extractUsername(html, initial.platform);
    const result: ResolveResult = {
      ...initial,
      username,
      source: username ? "metadata" : "none",
    };
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
