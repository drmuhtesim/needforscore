// @vitest-environment node
/**
 * SEO unit crawl — offline contract checks.
 * Live crawl lives in scripts/seo-crawl.ts.
 */

import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { readFileSync } from "fs";
import { resolve } from "path";
import SEO from "@/components/SEO";

const ssr = (ui: React.ReactElement) => {
  const helmetContext: any = {};
  renderToString(
    React.createElement(HelmetProvider, { context: helmetContext }, ui),
  );
  const h = helmetContext.helmet;
  return {
    title: h.title.toString(),
    meta: h.meta.toString(),
    link: h.link.toString(),
    script: h.script.toString(),
  };
};

describe("SEO component", () => {
  const out = ssr(
    <SEO
      title="Test Title"
      description="Test description"
      canonical="/score/example"
      image="https://example.com/og.png"
      type="profile"
      jsonLd={{ "@context": "https://schema.org", "@type": "Person", name: "example" }}
    />,
  );

  it("emits title + description", () => {
    expect(out.title).toContain("Test Title");
    expect(out.meta).toMatch(/name="description"[^>]*content="Test description"/);
  });

  it("emits absolute canonical for a relative input", () => {
    expect(out.link).toContain('href="https://www.needforscore.com/score/example"');
  });

  it("emits OpenGraph tags", () => {
    expect(out.meta).toMatch(/property="og:title"[^>]*content="Test Title"/);
    expect(out.meta).toMatch(/property="og:description"/);
    expect(out.meta).toMatch(/property="og:url"[^>]*needforscore\.com\/score\/example/);
    expect(out.meta).toMatch(/property="og:image"[^>]*example\.com\/og\.png/);
    expect(out.meta).toMatch(/property="og:type"[^>]*content="profile"/);
  });

  it("emits Twitter summary_large_image card", () => {
    expect(out.meta).toMatch(/name="twitter:card"[^>]*content="summary_large_image"/);
    expect(out.meta).toMatch(/name="twitter:title"/);
    expect(out.meta).toMatch(/name="twitter:image"/);
  });

  it("emits parseable JSON-LD", () => {
    expect(out.script).toContain('type="application/ld+json"');
    const match = out.script.match(
      /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/,
    );
    expect(match).toBeTruthy();
    const json = JSON.parse(match![1]);
    expect(json["@type"]).toBe("Person");
  });

  it("honours noindex", () => {
    const n = ssr(<SEO title="X" description="Y" noindex />);
    expect(n.meta).toMatch(/name="robots"[^>]*content="noindex, nofollow"/);
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
    expect(src).toContain('SITE_URL = "https://www.needforscore.com"');
  });

  it("covers every public route segment", () => {
    expect(src).toMatch(/\/score\//);
    expect(src).toMatch(/\/terms/);
    expect(src).toMatch(/\/privacy/);
    for (const seg of ['"instagram"', '"tiktok"', '"x"']) {
      expect(src.includes(seg)).toBe(true);
    }
  });

  it("excludes /phone/ entries from the sitemap (privacy)", () => {
    expect(src).toMatch(/cat === "phone"/);
  });
});
