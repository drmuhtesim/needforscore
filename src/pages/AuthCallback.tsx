import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * OAuth redirect landing page.
 * Supabase auto-detects the access_token/refresh_token in the URL hash
 * (detectSessionInUrl: true by default) and sets the session before this
 * effect runs. We just wait briefly then navigate to the intended next path.
 *
 * This route is also Capacitor-safe: it does not depend on Lovable's
 * `/~oauth/initiate` broker which is only available on Lovable hosting.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const nextParam = params.get("next");
    const safeNext =
      nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

    let cancelled = false;
    const go = async () => {
      // Give Supabase a tick to parse the URL hash and persist the session
      await new Promise((r) => setTimeout(r, 50));
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        navigate(safeNext, { replace: true });
      } else {
        navigate(`/auth?next=${encodeURIComponent(safeNext)}`, { replace: true });
      }
    };
    void go();
    return () => {
      cancelled = true;
    };
  }, [navigate, params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground">Signing you in…</div>
    </div>
  );
};

export default AuthCallback;
