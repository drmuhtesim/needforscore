import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import SEO, { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/components/SEO";
import EntryDetail from "@/pages/EntryDetail";
import { supabase } from "@/integrations/supabase/client";
import { formatTargetDisplay } from "@/lib/platforms";
import {
  buildPhoneSlug,
  categoryLabel,
  segmentToCategory,
  type EntityCategory,
} from "@/lib/entitySlugs";

/**
 * EntityProfile — canonical page for a (platform, target) pair.
 * Routes:
 *   /instagram/:slug  /tiktok/:slug  /x/:slug  /phone/:slug
 *
 * Renders the matching entry's full detail (header + comments) inline so
 * that the entry detail and the aggregate view share one URL. When more
 * than one entry exists for the same target, a small picker is rendered
 * above the detail and the selected entry is controlled via `?e=<id>`.
 *
 * `/score/:username` keeps using UserProfile, not this page.
 */
const EntityProfile = ({ segment }: { segment: string }) => {
  const { slug } = useParams();
  const [sp, setSp] = useSearchParams();
  const { t } = useTranslation();
  const category = segmentToCategory[segment] as EntityCategory | undefined;

  // Resolve slug → target_normalized.
  const [resolvedTarget, setResolvedTarget] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!category || !slug) {
        setResolvedTarget(null);
        return;
      }
      if (category !== "phone") {
        setResolvedTarget(decodeURIComponent(slug).toLowerCase());
        return;
      }
      const { data, error } = await supabase
        .from("entries")
        .select("target_normalized")
        .eq("category", "phone")
        .is("deleted_at", null)
        .limit(1000);
      if (cancelled) return;
      if (error || !data) {
        setResolvedTarget(null);
        return;
      }
      const seen = new Set<string>();
      for (const row of data) {
        const tn = (row as any).target_normalized as string;
        if (!tn || seen.has(tn)) continue;
        seen.add(tn);
        const s = await buildPhoneSlug(tn);
        if (s === slug) {
          if (!cancelled) setResolvedTarget(tn);
          return;
        }
      }
      if (!cancelled) setResolvedTarget(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [category, slug]);

  const { data, isLoading } = useQuery({
    queryKey: ["entity-entries", category, resolvedTarget],
    enabled: !!category && !!resolvedTarget,
    queryFn: async () => {
      const { data: entries } = await supabase
        .from("entries")
        .select("id, target, category, description, rating, created_at")
        .eq("category", category!)
        .eq("target_normalized", resolvedTarget!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      return entries ?? [];
    },
  });

  if (!category || category === "score") return <Navigate to="/" replace />;

  if (resolvedTarget === undefined || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-8 text-muted-foreground text-sm">{t("table.loading")}</div>
      </div>
    );
  }

  if (resolvedTarget === null || !data || data.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title={`${categoryLabel[category]} — bulunamadı | ${SITE_NAME}`}
          description={`${categoryLabel[category]} hesabı bulunamadı.`}
          canonical={`/${segment}/${slug}`}
          noindex
        />
        <Header />
        <div className="max-w-3xl mx-auto p-8">
          <p className="text-muted-foreground">{t("profile.notFound")}</p>
          <Link to="/" className="text-primary text-sm hover:underline mt-2 inline-block">
            ← {t("entry.backToList")}
          </Link>
        </div>
      </div>
    );
  }

  const entries = data as Array<{ id: string; target: string; description: string; rating: number; created_at: string }>;
  const selectedId = sp.get("e");
  const selected = (selectedId && entries.find((e) => e.id === selectedId)) || entries[0];

  const display = formatTargetDisplay(selected.target, category);
  const publicTitle = category === "phone" ? `Telefon ${slug}` : display;
  const canonical = `/${segment}/${slug}`;
  const ratings = entries.map((e) => e.rating).filter((r) => typeof r === "number");
  const avgRating = ratings.length ? ratings.reduce((s, v) => s + v, 0) / ratings.length : null;

  const seoTitle = `${publicTitle} — ${categoryLabel[category]} güvenilirlik & yorumlar | ${SITE_NAME}`;
  const seoDesc = (
    `${publicTitle} hakkında ${entries.length} entry` +
    (avgRating != null ? `, ortalama puan ${avgRating.toFixed(1)}/10. ` : ". ") +
    `${categoryLabel[category]} hesabı için Score topluluğunun güvenilirlik analizi.`
  ).slice(0, 158);

  const aggregateLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": category === "phone" ? "Thing" : "Person",
    name: publicTitle,
    url: `${SITE_URL}${canonical}`,
    identifier: category === "phone" ? slug : (resolvedTarget ?? slug),
  };
  if (avgRating != null) {
    aggregateLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avgRating.toFixed(2),
      bestRating: "10",
      worstRating: "1",
      ratingCount: entries.length,
    };
  }
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: categoryLabel[category], item: `${SITE_URL}/?category=${category}` },
      { "@type": "ListItem", position: 3, name: publicTitle, item: `${SITE_URL}${canonical}` },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoTitle}
        description={seoDesc}
        canonical={canonical}
        image={DEFAULT_OG_IMAGE}
        type="profile"
        jsonLd={[aggregateLd, breadcrumbLd]}
      />
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> {t("entry.backToList")}
        </Link>

        {entries.length > 1 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground uppercase tracking-wider">
              {entries.length} entry
            </span>
            {entries.map((e, i) => {
              const active = e.id === selected.id;
              return (
                <button
                  key={e.id}
                  onClick={() => {
                    const next = new URLSearchParams(sp);
                    if (i === 0) next.delete("e");
                    else next.set("e", e.id);
                    setSp(next, { replace: true });
                  }}
                  className={`px-2 py-1 rounded font-mono border transition-colors ${
                    active
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  #{i + 1} · {new Date(e.created_at).toLocaleDateString()}
                </button>
              );
            })}
          </div>
        )}

        <EntryDetail idOverride={selected.id} embedded />
      </main>
    </div>
  );
};

export default EntityProfile;
