import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const BodySchema = z.object({
  platform: z.enum(["instagram", "x", "tiktok"]),
});

function profileUrl(platform: string, handle: string): string {
  const h = handle.replace(/^@+/, "");
  switch (platform) {
    case "instagram":
      return `https://www.instagram.com/${h}/`;
    case "x":
      return `https://x.com/${h}`;
    case "tiktok":
      return `https://www.tiktok.com/@${h}`;
    default:
      throw new Error("unsupported platform");
  }
}

async function scrapeProfile(url: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: false,
      waitFor: 1500,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Firecrawl failed [${res.status}]: ${JSON.stringify(data)}`);
  }
  // v2 returns { data: { markdown, html, metadata } } or sometimes top-level
  const md: string =
    (data?.data?.markdown as string) ||
    (data?.markdown as string) ||
    (data?.data?.html as string) ||
    (data?.html as string) ||
    "";
  return md;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const fcKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!fcKey) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { platform } = parsed.data;

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: row, error: rowErr } = await admin
      .from("linked_accounts")
      .select("id, handle_normalized, verification_code, verified, attempt_count, last_attempt_at")
      .eq("user_id", userId)
      .eq("platform", platform)
      .maybeSingle();

    if (rowErr || !row) {
      return new Response(JSON.stringify({ error: "Önce bir hesap başlat (start)." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (row.verified) {
      return new Response(JSON.stringify({ verified: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate-limit: at most 1 attempt per 30s, 10 per day
    const now = Date.now();
    if (row.last_attempt_at && now - new Date(row.last_attempt_at).getTime() < 30_000) {
      return new Response(JSON.stringify({ error: "Çok hızlı, 30 saniye bekle." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (row.attempt_count >= 10) {
      return new Response(JSON.stringify({ error: "Çok fazla deneme. Yeni kod oluştur." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = profileUrl(platform, row.handle_normalized);
    let pageText = "";
    try {
      pageText = await scrapeProfile(url, fcKey);
    } catch (e) {
      await admin
        .from("linked_accounts")
        .update({
          attempt_count: row.attempt_count + 1,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      const msg = e instanceof Error ? e.message : "scrape error";
      return new Response(JSON.stringify({ error: `Profil okunamadı: ${msg}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const haystack = pageText.toUpperCase();
    const found = haystack.includes(row.verification_code.toUpperCase());

    if (!found) {
      await admin
        .from("linked_accounts")
        .update({
          attempt_count: row.attempt_count + 1,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      return new Response(
        JSON.stringify({
          verified: false,
          error: `Kod profilinizde bulunamadı. Bio'da "${row.verification_code}" yazıyor olmalı.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to verify; unique index will block if another user already verified same handle
    const { error: updErr } = await admin
      .from("linked_accounts")
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
        attempt_count: row.attempt_count + 1,
        last_attempt_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (updErr) {
      return new Response(
        JSON.stringify({ error: "Bu kullanıcı adı başka bir hesaba zaten bağlı." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ verified: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
