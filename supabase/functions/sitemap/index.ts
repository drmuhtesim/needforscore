import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { parsePhoneNumberFromString } from "https://esm.sh/libphonenumber-js@1.11.7";

const SITE_URL = "https://needforscore.com";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

interface UrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

const renderUrl = (e: UrlEntry) =>
  [
    "  <url>",
    `    <loc>${xmlEscape(e.loc)}</loc>`,
    e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
    e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
    e.priority ? `    <priority>${e.priority}</priority>` : null,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");

const CATEGORY_SEGMENTS: Record<string, string> = {
  instagram: "instagram",
  tiktok: "tiktok",
  twitter: "x",
  phone: "phone",
};

const CATEGORY_FILTERS = ["instagram", "tiktok", "twitter", "score", "phone"];

const sha256Hex = async (input: string): Promise<string> => {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const buildPhoneSlug = async (rawE164: string): Promise<string> => {
  const parsed = parsePhoneNumberFromString(rawE164);
  const cc = parsed?.country?.toLowerCase() ?? "intl";
  const national = (parsed?.nationalNumber ?? rawE164).toString().replace(/\D/g, "");
  const last2 = national.slice(-2).padStart(2, "x");
  const hash = (await sha256Hex(rawE164)).slice(0, 8);
  return `${cc}-xx-${last2}-${hash}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const entries: UrlEntry[] = [
    { loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${SITE_URL}/terms`, changefreq: "monthly", priority: "0.3" },
    { loc: `${SITE_URL}/privacy`, changefreq: "monthly", priority: "0.3" },
  ];

  for (const cat of CATEGORY_FILTERS) {
    entries.push({
      loc: `${SITE_URL}/?category=${cat}`,
      changefreq: "daily",
      priority: "0.7",
    });
  }

  const PAGE = 1000;

  // Score user profiles → /score/:username (canonical)
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("profiles")
      .select("username, updated_at")
      .order("signup_order", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    for (const p of data) {
      entries.push({
        loc: `${SITE_URL}/score/${encodeURIComponent(p.username)}`,
        lastmod: p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : undefined,
        changefreq: "weekly",
        priority: "0.8",
      });
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }

  // Aggregate entity pages: one URL per (category, target_normalized).
  // Track latest updated_at per group.
  const seen = new Map<string, string>(); // key: `${cat}|${target}` → lastmod
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("entries")
      .select("id, category, target_normalized, updated_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    for (const e of data) {
      // Individual entry detail (kept for backwards compatibility + deep linking)
      entries.push({
        loc: `${SITE_URL}/e/${e.id}`,
        lastmod: e.updated_at ? new Date(e.updated_at).toISOString().slice(0, 10) : undefined,
        changefreq: "weekly",
        priority: "0.5",
      });
      const cat = e.category as string;
      const tgt = e.target_normalized as string | null;
      if (!tgt || cat === "score") continue;
      const seg = CATEGORY_SEGMENTS[cat];
      if (!seg) continue;
      const key = `${seg}|${tgt}`;
      const lm = e.updated_at ? new Date(e.updated_at).toISOString().slice(0, 10) : "";
      if (!seen.has(key) || (lm && lm > (seen.get(key) ?? ""))) {
        seen.set(key, lm);
      }
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }

  for (const [key, lastmod] of seen.entries()) {
    const [seg, target] = key.split("|");
    let slug: string;
    if (seg === "phone") {
      try {
        slug = await buildPhoneSlug(target);
      } catch {
        continue;
      }
    } else {
      slug = encodeURIComponent(target);
    }
    entries.push({
      loc: `${SITE_URL}/${seg}/${slug}`,
      lastmod: lastmod || undefined,
      changefreq: "weekly",
      priority: "0.7",
    });
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.map(renderUrl).join("\n") +
    `\n</urlset>`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
