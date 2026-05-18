// Client helper: takes pasted text, returns a resolved social URL when
// possible. First tries the local URL parser; if the URL is recognized but
// the username can't be derived from the URL shape (Instagram reel,
// TikTok short link, X /i/status, YouTube shorts, etc.) it calls the
// `resolve-social-url` edge function which scrapes the page metadata.

import { supabase } from "@/integrations/supabase/client";
import { parseSocialUrl, looksLikeUrl, type ParsedSocialUrl } from "./socialUrlParser";

export interface ResolveOutcome {
  /** Final parsed result. `username` may still be null if metadata failed. */
  result: ParsedSocialUrl | null;
  /** True when the edge function was consulted. */
  resolved: boolean;
}

export const resolveSocialUrl = async (raw: string): Promise<ResolveOutcome> => {
  if (!raw || !looksLikeUrl(raw)) return { result: null, resolved: false };
  const local = parseSocialUrl(raw);
  if (!local) return { result: null, resolved: false };
  if (!local.needsResolve || local.username) return { result: local, resolved: false };

  try {
    const { data, error } = await supabase.functions.invoke("resolve-social-url", {
      body: { url: raw },
    });
    if (error || !data) return { result: local, resolved: true };
    const username = typeof data.username === "string" && data.username.length > 0
      ? data.username.toLowerCase()
      : null;
    return {
      result: { ...local, username, needsResolve: !username },
      resolved: true,
    };
  } catch {
    return { result: local, resolved: true };
  }
};
