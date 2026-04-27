import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const BodySchema = z.object({
  platform: z.enum(["instagram", "x", "tiktok"]),
  handle: z.string().trim().min(1).max(60),
});

function normalizeHandle(raw: string): string {
  return raw.replace(/^@+/, "").trim().toLowerCase();
}

function genCode(): string {
  // 6-digit code prefixed with SCR- so it's unique in bios
  const n = Math.floor(100000 + Math.random() * 900000);
  return `SCR-${n}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    const { platform, handle } = parsed.data;
    const normalized = normalizeHandle(handle);

    const admin = createClient(supabaseUrl, serviceKey);

    // If already verified by another user — block
    const { data: existing } = await admin
      .from("linked_accounts")
      .select("id, user_id, verified")
      .eq("platform", platform)
      .eq("handle_normalized", normalized)
      .eq("verified", true)
      .maybeSingle();
    if (existing && existing.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "Bu kullanıcı adı zaten başka bir kullanıcı tarafından doğrulandı." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const code = genCode();

    // Upsert by (user_id, platform): replace previous attempt
    const { data: row, error: upsertErr } = await admin
      .from("linked_accounts")
      .upsert(
        {
          user_id: userId,
          platform,
          handle: normalized,
          handle_normalized: normalized,
          verification_code: code,
          verified: false,
          verified_at: null,
          attempt_count: 0,
        },
        { onConflict: "user_id,platform" }
      )
      .select()
      .single();

    if (upsertErr) {
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ id: row.id, platform, handle: normalized, code }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
