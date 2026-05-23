// Renders index.html with dynamically injected OG meta tags so that
// social crawlers (WhatsApp, X, Facebook, Telegram, Slack, Discord, ...)
// see entity-specific titles and URLs instead of the generic root tags.
//
// Static hosting (`public/_redirects`) routes known crawler User-Agents
// for entity routes to this function. JS-capable browsers continue to
// hit the static SPA directly, unaffected.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE_URL = "https://needforscore.com";
const SITE_NAME = "Score (NeedForScore)";
const DEFAULT_OG_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/ZIFI5J5XtxTPJYoUuTh2VF2lc3v1/social-images/social-1777753002392-IMG_8199.webp";
const DEFAULT_TITLE =
  "Her türlü sanal dolandırıcılığa dur de! Yorum yap, puanla!";
const DEFAULT_DESC =
  "Instagram, TikTok ve X hesaplarına yorum yap; 1 ile 10 arasında puan ver; iyi ile kötüyü, sahte ile gerçeği ayırt et.";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
);

const SEGMENT_TO_CATEGORY: Record<string, string> = {
  x: "twitter",
  twitter: "twitter",
  instagram: "instagram",
  tiktok: "tiktok",
  phone: "phone",
};

const CATEGORY_LABEL: Record<string, string> = {
  twitter: "X",
  instagram: "Instagram",
  tiktok: "TikTok",
  phone: "Telefon",
  score: "Score",
};

const htmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const OG_IMAGE_BASE = `${Deno.env.get("SUPABASE_URL")}/functions/v1/og-image`;

async function buildEntityMeta(
  path: string,
): Promise<{ title: string; desc: string; url: string; image: string; noindex?: boolean } | null> {
  // /x/:slug, /instagram/:slug, /tiktok/:slug, /phone/:slug, /score/:username
  const m = path.match(/^\/([a-z]+)\/([^/?#]+)/i);
  if (!m) return null;
  const seg = m[1].toLowerCase();
  const slug = decodeURIComponent(m[2]);
  const url = `${SITE_URL}${path}`;

  if (seg === "score" || seg === "u") {
    const handle = slug.toLowerCase();
    return {
      title: `@${handle} — Score profili | ${SITE_NAME}`,
      desc: `@${handle} kullanıcısının Score profili: entry'ler, puanlar ve güvenilirlik analizi.`,
      url,
      image: `${OG_IMAGE_BASE}?category=score&handle=${encodeURIComponent(handle)}`,
    };
  }

  const category = SEGMENT_TO_CATEGORY[seg];
  if (!category) return null;

  const label = CATEGORY_LABEL[category] ?? category;
  const isPhone = category === "phone";

  // For phone, never embed any digits in social meta — keep it generic.
  let display = isPhone ? "Telefon raporu" : `@${slug.toLowerCase()}`;
  let count = 0;
  let avg: number | null = null;

  if (!isPhone) {
    const { data } = await supabase
      .from("entries")
      .select("rating")
      .eq("category", category)
      .eq("target_normalized", slug.toLowerCase())
      .is("deleted_at", null);
    if (data && data.length) {
      count = data.length;
      const ratings = data.map((r: any) => r.rating).filter((v: any) => typeof v === "number");
      if (ratings.length) avg = ratings.reduce((s: number, v: number) => s + v, 0) / ratings.length;
    }
  }

  const title = isPhone
    ? `Telefon raporu | ${SITE_NAME}`
    : `${display} — ${label} güvenilirlik & yorumlar | ${SITE_NAME}`;
  const desc = isPhone
    ? "Telefon numarası raporları yalnızca tam numarayı bilen kullanıcılar tarafından aranabilir. Gizliliğe öncelik veriyoruz."
    : ((count
        ? `${display} hakkında ${count} entry${avg != null ? `, ortalama puan ${avg.toFixed(1)}/10. ` : ". "}`
        : `${display} için Score topluluğunun ${label} güvenilirlik analizi. `) +
       "Score'da yorum yap, puanla.");

  const image = isPhone
    ? DEFAULT_OG_IMAGE
    : `${OG_IMAGE_BASE}?category=${encodeURIComponent(category)}&handle=${encodeURIComponent(slug.toLowerCase())}`;

  return { title, desc: desc.slice(0, 200), url, image, noindex: isPhone };
}

function injectMeta(
  html: string,
  meta: { title: string; desc: string; url: string; image: string },
): string {
  const t = htmlEscape(meta.title);
  const d = htmlEscape(meta.desc);
  const u = htmlEscape(meta.url);
  const img = htmlEscape(meta.image);

  let out = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${t}</title>`);
  out = out.replace(
    /<meta\s+name="description"[^>]*>/i,
    `<meta name="description" content="${d}">`,
  );
  out = out.replace(
    /<link\s+rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${u}" />`,
  );
  out = out.replace(
    /<meta\s+property="og:title"[^>]*>/gi,
    `<meta property="og:title" content="${t}">`,
  );
  out = out.replace(
    /<meta\s+property="og:description"[^>]*>/gi,
    `<meta property="og:description" content="${d}">`,
  );
  out = out.replace(
    /<meta\s+name="twitter:title"[^>]*>/gi,
    `<meta name="twitter:title" content="${t}">`,
  );
  out = out.replace(
    /<meta\s+name="twitter:description"[^>]*>/gi,
    `<meta name="twitter:description" content="${d}">`,
  );
  out = out.replace(
    /<meta\s+property="og:image"[^>]*>/gi,
    `<meta property="og:image" content="${img}">`,
  );
  out = out.replace(
    /<meta\s+name="twitter:image"[^>]*>/gi,
    `<meta name="twitter:image" content="${img}">`,
  );
  const ogUrlTag = `<meta property="og:url" content="${u}" />`;
  if (/<meta\s+property="og:url"[^>]*>/i.test(out)) {
    out = out.replace(/<meta\s+property="og:url"[^>]*>/i, ogUrlTag);
  } else {
    out = out.replace(/<\/head>/i, `  ${ogUrlTag}\n</head>`);
  }
  return out;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.searchParams.get("path") ?? "/";

  // Fetch live index.html from the public site to stay in sync with builds.
  let html: string;
  try {
    const res = await fetch(`${SITE_URL}/index.html`, {
      headers: { "User-Agent": "og-prerender/1.0" },
    });
    html = await res.text();
  } catch {
    html = `<!doctype html><html><head><title>${DEFAULT_TITLE}</title><meta name="description" content="${DEFAULT_DESC}"><meta property="og:image" content="${DEFAULT_OG_IMAGE}"></head><body></body></html>`;
  }

  const meta = await buildEntityMeta(path);
  if (meta) {
    html = injectMeta(html, meta);
  }

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
      "X-Robots-Tag": "all",
    },
  });
});
