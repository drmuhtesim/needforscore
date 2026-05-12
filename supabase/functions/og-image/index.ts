// Dynamic OG image renderer.
// GET /functions/v1/og-image?category=score|instagram|tiktok|twitter|phone&handle=<slug>
// Returns 1200x630 PNG personalised with avatar (when available) + handle.

import satori from "https://esm.sh/satori@0.10.13";
import { Resvg, initWasm } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE_NAME = "Score";
const BG = "#0F172A";
const FG = "#F1F5F9";
const MUTED = "#94A3B8";
const ACCENT = "#22C55E";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
);

let wasmInitialized = false;
async function ensureWasm() {
  if (wasmInitialized) return;
  const buf = await fetch(
    "https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@2.6.2/index_bg.wasm",
  ).then((r) => r.arrayBuffer());
  await initWasm(buf);
  wasmInitialized = true;
}

let fontBoldPromise: Promise<ArrayBuffer> | null = null;
let fontRegularPromise: Promise<ArrayBuffer> | null = null;
function getFonts() {
  if (!fontBoldPromise) {
    fontBoldPromise = fetch(
      "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf",
    ).then((r) => r.arrayBuffer());
  }
  if (!fontRegularPromise) {
    fontRegularPromise = fetch(
      "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf",
    ).then((r) => r.arrayBuffer());
  }
  return Promise.all([fontBoldPromise, fontRegularPromise]);
}

async function imageToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "image/jpeg";
    const buf = new Uint8Array(await res.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    return `data:${ct};base64,${btoa(bin)}`;
  } catch {
    return null;
  }
}

const CATEGORY_LABEL: Record<string, string> = {
  twitter: "X",
  instagram: "Instagram",
  tiktok: "TikTok",
  phone: "Telefon",
  score: "Score profili",
};

type Stats = { count: number; avg: number | null };

async function lookup(category: string, handle: string): Promise<{
  display: string;
  sub: string;
  avatarUrl: string | null;
  stats: Stats;
}> {
  let display = handle;
  let sub = CATEGORY_LABEL[category] ?? category;
  let avatarUrl: string | null = null;

  if (category === "score") {
    display = `@${handle.toLowerCase()}`;
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, show_avatar, display_name, show_display_name")
      .eq("username", handle.toLowerCase())
      .maybeSingle();
    if (data) {
      if (data.show_avatar && data.avatar_url) avatarUrl = data.avatar_url;
      if (data.show_display_name && data.display_name) sub = data.display_name;
    }
  } else if (category === "phone") {
    display = `Telefon`;
    sub = handle;
  } else {
    display = `@${handle.toLowerCase()}`;
  }

  let stats: Stats = { count: 0, avg: null };
  if (category !== "phone" && category !== "score") {
    const { data } = await supabase
      .from("entries")
      .select("rating")
      .eq("category", category)
      .eq("target_normalized", handle.toLowerCase())
      .is("deleted_at", null);
    if (data?.length) {
      const r = data.map((x: any) => x.rating).filter((v: any) => typeof v === "number");
      stats = {
        count: data.length,
        avg: r.length ? r.reduce((s: number, v: number) => s + v, 0) / r.length : null,
      };
    }
  }

  return { display, sub, avatarUrl, stats };
}

function avatarNode(dataUrl: string | null, initial: string): any {
  if (dataUrl) {
    return {
      type: "img",
      props: {
        src: dataUrl,
        width: 220,
        height: 220,
        style: {
          borderRadius: 9999,
          objectFit: "cover",
          border: `6px solid ${ACCENT}`,
        },
      },
    };
  }
  return {
    type: "div",
    props: {
      style: {
        width: 220,
        height: 220,
        borderRadius: 9999,
        background: `linear-gradient(135deg, ${ACCENT}, #0EA5E9)`,
        color: "#0F172A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 110,
        fontWeight: 700,
        border: `6px solid ${ACCENT}`,
      },
      children: initial.toUpperCase(),
    },
  };
}

function buildTree(opts: {
  display: string;
  sub: string;
  category: string;
  avatarDataUrl: string | null;
  stats: Stats;
  urlPath: string;
}) {
  const { display, sub, category, avatarDataUrl, stats } = opts;
  const initial = (display.replace(/^@/, "")[0] ?? "?");

  const children: any[] = [
    avatarNode(avatarDataUrl, initial),
    {
      type: "div",
      props: {
        style: { display: "flex", flexDirection: "column", marginLeft: 56, maxWidth: 760 },
        children: [
          {
            type: "div",
            props: {
              style: {
                color: ACCENT,
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: "uppercase",
              },
              children: CATEGORY_LABEL[category] ?? category,
            },
          },
          {
            type: "div",
            props: {
              style: {
                color: FG,
                fontSize: 88,
                fontWeight: 700,
                lineHeight: 1.05,
                marginTop: 8,
                overflow: "hidden",
              },
              children: display,
            },
          },
          stats.count > 0
            ? {
                type: "div",
                props: {
                  style: {
                    color: MUTED,
                    fontSize: 30,
                    marginTop: 18,
                    display: "flex",
                  },
                  children: `${stats.count} entry${
                    stats.avg != null ? `  ·  ortalama ${stats.avg.toFixed(1)}/10` : ""
                  }`,
                },
              }
            : {
                type: "div",
                props: {
                  style: { color: MUTED, fontSize: 30, marginTop: 18, display: "flex" },
                  children: sub !== (CATEGORY_LABEL[category] ?? category) ? sub : "Score topluluğunda yorumla",
                },
              },
        ],
      },
    },
  ];

  return {
    type: "div",
    props: {
      style: {
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: `linear-gradient(135deg, ${BG} 0%, #1E293B 100%)`,
        padding: 64,
        fontFamily: "Inter",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              color: ACCENT,
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: 2,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: ACCENT,
                    color: BG,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    fontWeight: 700,
                    marginRight: 16,
                  },
                  children: "S",
                },
              },
              `${SITE_NAME}`,
              {
                type: "div",
                props: {
                  style: {
                    marginLeft: "auto",
                    color: FG,
                    fontSize: 28,
                    fontWeight: 400,
                    letterSpacing: 0,
                    fontFamily: "Inter",
                    display: "flex",
                  },
                  children: opts.urlPath,
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: { display: "flex", alignItems: "center" },
            children,
          },
        },
        {
          type: "div",
          props: {
            style: { color: MUTED, fontSize: 26, display: "flex" },
            children: "Her türlü sanal dolandırıcılığa dur de — yorum yap, puanla.",
          },
        },
      ],
    },
  };
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const category = (url.searchParams.get("category") ?? "score").toLowerCase();
  const handle = (url.searchParams.get("handle") ?? "").trim();
  if (!handle) return new Response("missing handle", { status: 400 });

  try {
    const [meta] = await Promise.all([lookup(category, handle)]);
    const avatarDataUrl = meta.avatarUrl ? await imageToDataUrl(meta.avatarUrl) : null;
    const tree = buildTree({
      display: meta.display,
      sub: meta.sub,
      category,
      avatarDataUrl,
      stats: meta.stats,
    });

    const [bold, regular] = await getFonts();
    const svg = await satori(tree as any, {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: regular, weight: 400, style: "normal" },
        { name: "Inter", data: bold, weight: 700, style: "normal" },
      ],
    });

    await ensureWasm();
    const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } })
      .render()
      .asPng();

    return new Response(png, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (e) {
    console.error("og-image error", e);
    return new Response(`error: ${(e as Error).message}`, { status: 500 });
  }
});
