// Validates dynamic OG meta tags for crawler previews
// (WhatsApp, X/Twitterbot, LinkedInBot, Facebook, Telegram, Slack, Discord)
// Run via: deno test --allow-net --allow-env supabase/functions/og-prerender/index.test.ts

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";

const FN_URL = `${Deno.env.get("VITE_SUPABASE_URL")}/functions/v1/og-prerender`;
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const CRAWLERS = [
  { name: "WhatsApp", ua: "WhatsApp/2.23" },
  { name: "Twitterbot (X)", ua: "Twitterbot/1.0" },
  { name: "LinkedInBot", ua: "LinkedInBot/1.0 (compatible; Mozilla/5.0)" },
  { name: "facebookexternalhit", ua: "facebookexternalhit/1.1" },
  { name: "TelegramBot", ua: "TelegramBot (like TwitterBot)" },
  { name: "Slackbot", ua: "Slackbot-LinkExpanding 1.0" },
  { name: "Discordbot", ua: "Mozilla/5.0 (compatible; Discordbot/2.0)" },
];

const SAMPLES: Array<{ path: string; mustContain: string[] }> = [
  { path: "/x/heathleyeth",        mustContain: ["@heathleyeth", "/x/heathleyeth"] },
  { path: "/instagram/heathleyeth", mustContain: ["@heathleyeth", "/instagram/heathleyeth"] },
  { path: "/tiktok/heathleyeth",   mustContain: ["@heathleyeth", "/tiktok/heathleyeth"] },
  { path: "/score/kijujan",        mustContain: ["@kijujan", "/score/kijujan"] },
];

const META_KEYS = [
  /<meta\s+property="og:title"\s+content="([^"]+)"/i,
  /<meta\s+property="og:description"\s+content="([^"]+)"/i,
  /<meta\s+property="og:url"\s+content="([^"]+)"/i,
  /<meta\s+property="og:image"\s+content="([^"]+)"/i,
  /<meta\s+name="twitter:title"\s+content="([^"]+)"/i,
  /<meta\s+name="twitter:image"\s+content="([^"]+)"/i,
];

async function fetchAs(ua: string, path: string): Promise<string> {
  const res = await fetch(`${FN_URL}?path=${encodeURIComponent(path)}`, {
    headers: { "User-Agent": ua, Authorization: `Bearer ${ANON}`, apikey: ANON },
  });
  const html = await res.text();
  assertEquals(res.status, 200, `${ua} ${path} → ${res.status}`);
  return html;
}

for (const sample of SAMPLES) {
  for (const crawler of CRAWLERS) {
    Deno.test(`${crawler.name} sees correct OG for ${sample.path}`, async () => {
      const html = await fetchAs(crawler.ua, sample.path);

      for (const re of META_KEYS) {
        const m = html.match(re);
        assert(m, `Missing meta tag matching ${re} for ${sample.path}`);
        assert(m![1].length > 0, `Empty meta content for ${re}`);
      }

      const ogUrl = html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i)![1];
      const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)![1];
      const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)![1];

      for (const needle of sample.mustContain) {
        assert(
          ogUrl.includes(needle) || ogTitle.includes(needle),
          `Expected "${needle}" in og:url or og:title — got url=${ogUrl} title=${ogTitle}`,
        );
      }

      assertStringIncludes(ogImage, "/og-image", "og:image must point to dynamic generator");
      assertStringIncludes(ogImage, "handle=", "og:image must carry handle param");
    });
  }
}
