// @vitest-environment node
/**

 * SEO unit crawl.
 *
 * Validates the offline contract of our SEO surface:
 *   - <SEO> component emits the right title/description/canonical/og/twitter tags
 *   - JSON-LD blocks render as parseable application/ld+json scripts
 *   - public/robots.txt advertises /sitemap.xml and excludes /phone/
 *   - the sitemap edge function source includes the public route segments
 *
 * Live crawl (hits the real domain) lives in scripts/seo-crawl.ts so CI stays offline.
 */
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { readFileSync } from "fs";
import { resolve } from "path";
import SEO from "@/components/SEO";

const render = (ui: React.ReactElement) => {

  const helmetContext: any = {};
  renderToStaticMarkup(<HelmetProvider context={helmetContext}>{ui}</HelmetProvider>);
  return helmetContext.helmet;
};

describe("SEO component", () => {
  let helmet: any;

  beforeEach(() => {
    helmet = render(
      <SEO
        title="Test Title"
        description="Test description"
        canonical="/score/example"
        image="https://example.com/og.png"
        type="profile"
        jsonLd={{ "@context": "https://schema.org", "@type": "Person", name: "example" }}
      />,
    );
  });

  it("emits title + description", () => {
    expect(helmet.title.toString()).toContain("Test Title");
    const metas = helmet.meta.toString();
    expect(metas).toMatch(/name="description"[^>]*content="Test description"/);
  });

  it("emits absolute canonical for a relative input", () => {
    expect(helmet.link.toString()).toContain(
      'href="https://needforscore.com/score/example"',
    );
  });

  it("emits OpenGraph tags", () => {
    const metas = helmet.meta.toString();
    expect(metas).toMatch(/property="og:title"[^>]*content="Test Title"/);
    expect(metas).toMatch(/property="og:description"/);
    expect(metas).toMatch(/property="og:url"[^>]*needforscore\.com\/score\/example/);
    expect(metas).toMatch(/property="og:image"[^>]*example\.com\/og\.png/);
    expect(metas).toMatch(/property="og:type"[^>]*content="profile"/);
  });

  it("emits Twitter summary_large_image card", () => {
    const metas = helmet.meta.toString();
    expect(metas).toMatch(/name="twitter:card"[^>]*content="summary_large_image"/);
    expect(metas).toMatch(/name="twitter:title"/);
    expect(metas).toMatch(/name="twitter:image"/);
  });

  it("emits parseable JSON-LD", () => {
    const scripts = helmet.script.toString();
    expect(scripts).toContain('type="application/ld+json"');
    const match = scripts.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    expect(match).toBeTruthy();
    const json = JSON.parse(match![1]);
    expect(json["@type"]).toBe("Person");
  });

  it("honours noindex", () => {
    const h = render(<SEO title="X" description="Y" noindex />);
    expect(h.meta.toString()).toMatch(/name="robots"[^>]*content="noindex, nofollow"/);
  });
});

describe("robots.txt", () => {
  const txt = readFileSync(resolve("public/robots.txt"), "utf8");

  it("advertises the canonical sitemap", () => {
    expect(txt).toMatch(/Sitemap:\s*https:\/\/needforscore\.com\/sitemap\.xml/);
  });

  it("disallows /phone/ for privacy", () => {
    expect(txt).toMatch(/Disallow:\s*\/phone\//);
  });
});

describe("sitemap edge function source", () => {
  const src = readFileSync(resolve("supabase/functions/sitemap/index.ts"), "utf8");

  it("uses the canonical site URL", () => {
    expect(src).toContain('SITE_URL = "https://needforscore.com"');
  });

  it("covers every public route segment", () => {
    // sitemap builds URLs from CATEGORY_SEGMENTS + literal /score/ + statics
    expect(src).toMatch(/\/score\//);
    expect(src).toMatch(/\/terms/);
    expect(src).toMatch(/\/privacy/);
    for (const seg of ['"instagram"', '"tiktok"', '"x"']) {
      expect(src.includes(seg)).toBe(true);
    }
  });


  it("excludes /phone/ entries from the sitemap (privacy)", () => {
    expect(src).toMatch(/cat === "phone"/);
    expect(src).toMatch(/continue/);
  });
});
