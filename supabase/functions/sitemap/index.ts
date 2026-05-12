import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

const CATEGORIES = ["instagram", "tiktok", "twitter", "score", "phone"];

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

  for (const cat of CATEGORIES) {
    entries.push({
      loc: `${SITE_URL}/?category=${cat}`,
      changefreq: "daily",
      priority: "0.7",
    });
  }

  // All public profiles (paginate to bypass 1000-row default)
  const PAGE = 1000;
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
        loc: `${SITE_URL}/u/${encodeURIComponent(p.username)}`,
        lastmod: p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : undefined,
        changefreq: "weekly",
        priority: "0.8",
      });
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }

  // All public entries (review pages)
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("entries")
      .select("id, updated_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    for (const e of data) {
      entries.push({
        loc: `${SITE_URL}/e/${e.id}`,
        lastmod: e.updated_at ? new Date(e.updated_at).toISOString().slice(0, 10) : undefined,
        changefreq: "weekly",
        priority: "0.6",
      });
    }
    if (data.length < PAGE) break;
    from += PAGE;
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
