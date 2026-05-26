// Fetches Open Graph / Twitter Card metadata for arbitrary URLs so the
// in-app link preview can render a rich fallback card when a site cannot
// be embedded (X-Frame-Options / CSP). Lightweight, in-memory LRU cache.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Meta {
  url: string;
  finalUrl: string;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  siteName: string | null;
  provider: string | null;
}

const cache = new Map<string, { at: number; data: Meta }>();
const TTL = 6 * 60 * 60 * 1000; // 6h

const safeUrl = (s: string): URL | null => {
  try { return new URL(s); } catch { return null; }
};

const decodeEntities = (s: string): string =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

const pickMeta = (html: string, names: string[]): string | null => {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)\\s*=\\s*["']${name}["'][^>]*>`,
      "i",
    );
    const tag = html.match(re)?.[0];
    if (!tag) continue;
    const content = tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1];
    if (content) return decodeEntities(content.trim());
  }
  return null;
};

const pickTitle = (html: string): string | null => {
  const og = pickMeta(html, ["og:title", "twitter:title"]);
  if (og) return og;
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return t ? decodeEntities(t).trim().slice(0, 240) : null;
};

const pickIcon = (html: string, base: URL): string | null => {
  const re = /<link[^>]+rel\s*=\s*["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]*>/gi;
  const matches = html.match(re) ?? [];
  for (const m of matches) {
    const href = m.match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
    if (href) {
      try { return new URL(href, base).toString(); } catch { /* ignore */ }
    }
  }
  return `${base.origin}/favicon.ico`;
};

const absolutize = (raw: string | null, base: URL): string | null => {
  if (!raw) return null;
  try { return new URL(raw, base).toString(); } catch { return null; }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const url = new URL(req.url);
  const target = url.searchParams.get("url");
  if (!target) {
    return new Response(JSON.stringify({ error: "url required" }), {
      status: 400,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }
  const parsed = safeUrl(target);
  if (!parsed || !/^https?:$/.test(parsed.protocol)) {
    return new Response(JSON.stringify({ error: "invalid url" }), {
      status: 400,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }

  const key = parsed.toString();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) {
    return new Response(JSON.stringify(hit.data), {
      headers: { ...CORS, "content-type": "application/json", "cache-control": "public, max-age=3600" },
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(parsed.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; NeedForScoreBot/1.0; +https://needforscore.com)",
        "accept": "text/html,application/xhtml+xml",
        "accept-language": "en,tr;q=0.8",
      },
    });
    clearTimeout(timeout);
    const finalUrl = res.url || parsed.toString();
    const base = safeUrl(finalUrl) ?? parsed;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) {
      const meta: Meta = {
        url: parsed.toString(),
        finalUrl,
        title: base.hostname,
        description: null,
        image: null,
        favicon: `${base.origin}/favicon.ico`,
        siteName: base.hostname.replace(/^www\./, ""),
        provider: null,
      };
      cache.set(key, { at: Date.now(), data: meta });
      return new Response(JSON.stringify(meta), {
        headers: { ...CORS, "content-type": "application/json" },
      });
    }
    // Limit body read to ~256KB
    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder();
      let total = 0;
      while (total < 262144) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        html += decoder.decode(value, { stream: true });
      }
      try { reader.cancel(); } catch { /* ignore */ }
    }

    const meta: Meta = {
      url: parsed.toString(),
      finalUrl,
      title: pickTitle(html),
      description: pickMeta(html, ["og:description", "twitter:description", "description"]),
      image: absolutize(pickMeta(html, ["og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"]), base),
      favicon: pickIcon(html, base),
      siteName: pickMeta(html, ["og:site_name"]) ?? base.hostname.replace(/^www\./, ""),
      provider: pickMeta(html, ["og:type"]),
    };

    cache.set(key, { at: Date.now(), data: meta });
    if (cache.size > 500) {
      const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at)[0]?.[0];
      if (oldest) cache.delete(oldest);
    }

    return new Response(JSON.stringify(meta), {
      headers: { ...CORS, "content-type": "application/json", "cache-control": "public, max-age=3600" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return new Response(JSON.stringify({
      url: parsed.toString(),
      finalUrl: parsed.toString(),
      title: parsed.hostname.replace(/^www\./, ""),
      description: null,
      image: null,
      favicon: `${parsed.origin}/favicon.ico`,
      siteName: parsed.hostname.replace(/^www\./, ""),
      provider: null,
      error: msg,
    } satisfies Meta & { error: string }), {
      headers: { ...CORS, "content-type": "application/json" },
    });
  }
});
