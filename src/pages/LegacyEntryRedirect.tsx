import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { buildEntityUrl, type EntityCategory } from "@/lib/entitySlugs";

/**
 * Permanent (client-side) redirect from /e/:id → /{segment}/:slug.
 * Looks up the entry's category + target_normalized, builds the canonical
 * entity URL, and replaces history. Hash (e.g. #c-xyz) is preserved.
 */
const LegacyEntryRedirect = () => {
  const { id } = useParams();
  const { hash } = useLocation();
  const [target, setTarget] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setTarget(null);
        return;
      }
      const { data, error } = await supabase
        .from("entries")
        .select("category, target_normalized")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setTarget(null);
        return;
      }
      const url = await buildEntityUrl(
        data.category as EntityCategory,
        data.target_normalized,
      );
      if (!cancelled) setTarget(`${url}${hash ?? ""}`);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, hash]);

  if (target === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-8 text-muted-foreground text-sm">…</div>
      </div>
    );
  }
  if (target === null) return <Navigate to="/" replace />;
  return <Navigate to={target} replace />;
};

export default LegacyEntryRedirect;
