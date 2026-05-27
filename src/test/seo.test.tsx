/**
 * SEO unit crawl.
 *
 * Validates the offline contract of our SEO surface:
 *   - SEO component emits title/description/canonical/og/twitter tags
 *   - JSON-LD blocks render as parseable application/ld+json scripts
 *   - public/robots.txt advertises /sitemap.xml and excludes /phone/
 *   - sitemap edge function source covers every public route segment
 *
 * Live crawl (hits the real domain) lives in scripts/seo-crawl.ts so CI stays offline.
 */
import React, { act } from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { readFileSync } from "fs";
import { resolve } from "path";
import SEO from "@/components/SEO";

const mount = async (ui: React.ReactElement) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  await act(async () => {
    root.render(<HelmetProvider>{ui}</HelmetProvider>);
  });
  // Helmet flushes head mutations via requestAnimationFrame; give it a tick.
  await new Promise((r) => setTimeout(r, 0));
  return {
    head: () => document.head.innerHTML,
    cleanup: async () => {
      await act(async () => root.unmount());
      container.remove();
      document.head.querySelectorAll("[data-rh='true']").forEach((n) => n.remove());
      document.title = "";
    },
  };
};


describe("SEO component", () => {
  let head: string;
  let cleanup: () => void;

  beforeEach(() => {
    const m = mount(
      <SEO
        title="Test Title"
        description="Test description"
        canonical="/score/example"
        image="https://example.com/og.png"
        type="profile"
        jsonLd={{ "@context": "https://schema.org", "@type": "Person", name: "example" }}
      />,
    );
    head = m.head();
    cleanup = m.cleanup;
  });

  afterEach(() => cleanup());

  it("emits title + description", () => {
    expect(document.title).toBe("Test Title");
    expect(head).toMatch(/name="description"[^>]*content="Test description"/);
  });

  it("emits absolute canonical for a relative input", () => {
    expect(head).toContain('href="https://needforscore.com/score/example"');
  });

  it("emits OpenGraph tags", () => {
    expect(head).toMatch(/property="og:title"[^>]*content="Test Title"/);
    expect(head).toMatch(/property="og:description"/);
    expect(head).toMatch(/property="og:url"[^>]*needforscore\.com\/score\/example/);
    expect(head).toMatch(/property="og:image"[^>]*example\.com\/og\.png/);
    expect(head).toMatch(/property="og:type"[^>]*content="profile"/);
  });

  it("emits Twitter summary_large_image card", () => {
    expect(head).toMatch(/name="twitter:card"[^>]*content="summary_large_image"/);
    expect(head).toMatch(/name="twitter:title"/);
    expect(head).toMatch(/name="twitter:image"/);
  });

  it("emits parseable JSON-LD", () => {
    expect(head).toContain('type="application/ld+json"');
    const match = head.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/);
    expect(match).toBeTruthy();
    const json = JSON.parse(match![1]);
    expect(json["@type"]).toBe("Person");
  });

  it("honours noindex", () => {
    const m = mount(<SEO title="X" description="Y" noindex />);
    expect(m.head()).toMatch(/name="robots"[^>]*content="noindex, nofollow"/);
    m.cleanup();
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
