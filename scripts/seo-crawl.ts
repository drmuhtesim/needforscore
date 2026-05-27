/**
 * Live SEO crawl — run manually after publishes.
 *   bunx tsx scripts/seo-crawl.ts            # crawls https://needforscore.com
 *   bunx tsx scripts/seo-crawl.ts <base-url> # crawls a preview / staging URL
 *
 * Fetches /sitemap.xml, picks a representative sample (statics + a few dynamic
 * URLs from each category), and validates every page has:
 *   - <title>, <meta name="description">
 *   - <link rel="canonical"> (exactly one)
 *   - og:title / og:description / og:url / og:image
 *   - twitter:card
 * Exits 1 with a report when any URL fails — wire into a publish hook if desired.
 */

const BASE = (process.argv[2] ?? "https://needforscore.com").replace(/\/+$/, "");
const SAMPLE_PER_SEGMENT = 3;

type Issue = { url: string; problems: string[] };

const fetchText = async (url: string): Promise<string> => {
  const res = await fetch(url, {
    headers: { "User-Agent": "needforscore-seo-crawl/1.0 (+https://needforscore.com)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.text();
};

const between = (html: string, re: RegExp) => html.match(re)?.[1]?.trim() ?? null;

const pickContent = (html: string, key: "name" | "property", value: string) =>
  between(
    html,
    new RegExp(`<meta[^>]+${key}=["']${value}["'][^>]+content=["']([^"']+)["']`, "i"),
  ) ??
  between(
    html,
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${key}=["']${value}["']`, "i"),
  );

const audit = (url: string, html: string): string[] => {
  const problems: string[] = [];
  if (!between(html, /<title>([^<]+)<\/title>/i)) problems.push("missing <title>");
  if (!pickContent(html, "name", "description")) problems.push("missing description");

  const canonicalCount = (html.match(/<link[^>]+rel=["']canonical["']/gi) ?? []).length;
  if (canonicalCount === 0) problems.push("missing canonical");
  else if (canonicalCount > 1) problems.push(`duplicate canonical (${canonicalCount})`);

  for (const k of ["og:title", "og:description", "og:url", "og:image"]) {
    if (!pickContent(html, "property", k)) problems.push(`missing ${k}`);
  }
  if (!pickContent(html, "name", "twitter:card")) problems.push("missing twitter:card");

  // Pages must not be silently noindex unless they explicitly are (phone, mod, etc.)
  const robots = pickContent(html, "name", "robots") ?? "";
  if (/noindex/i.test(robots) && !/\/(phone|mod|messages|notifications|verify-email|unsubscribe|onboarding|auth\/callback)/.test(url)) {
    problems.push(`unexpected noindex on public route`);
  }
  return problems;
};

const sampleSitemap = async (): Promise<string[]> => {
  const xml = await fetchText(`${BASE}/sitemap.xml`);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (locs.length === 0) throw new Error("sitemap has no <loc> entries");

  // Always include the few statics, then up to N per dynamic segment.
  const buckets = new Map<string, string[]>();
  for (const loc of locs) {
    const seg = new URL(loc).pathname.split("/")[1] || "root";
    if (!buckets.has(seg)) buckets.set(seg, []);
    buckets.get(seg)!.push(loc);
  }
  const picked: string[] = [];
  for (const [seg, list] of buckets) {
    const take = ["root", "terms", "privacy"].includes(seg) ? list.length : SAMPLE_PER_SEGMENT;
    picked.push(...list.slice(0, take));
  }
  return picked;
};

const main = async () => {
  console.log(`SEO crawl → ${BASE}`);
  const urls = await sampleSitemap();
  console.log(`Sampling ${urls.length} URLs from sitemap…\n`);

  const issues: Issue[] = [];
  let ok = 0;
  for (const url of urls) {
    try {
      const html = await fetchText(url);
      const problems = audit(url, html);
      if (problems.length === 0) {
        ok++;
        console.log(`✓ ${url}`);
      } else {
        issues.push({ url, problems });
        console.log(`✗ ${url}\n    - ${problems.join("\n    - ")}`);
      }
    } catch (e) {
      issues.push({ url, problems: [`fetch failed: ${(e as Error).message}`] });
      console.log(`✗ ${url}\n    - fetch failed: ${(e as Error).message}`);
    }
  }

  console.log(`\n${ok}/${urls.length} OK, ${issues.length} with issues`);
  if (issues.length > 0) process.exit(1);
};

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
