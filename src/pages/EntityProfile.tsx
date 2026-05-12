import { useEffect, useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, BadgeCheck, MessageSquare, ShieldAlert, ShieldCheck, ShieldQuestion, Star } from "lucide-react";
import Header from "@/components/Header";
import PlatformIcon from "@/components/PlatformIcon";
import SEO, { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { formatTargetDisplay } from "@/lib/platforms";
import {
  buildPhoneSlug,
  categoryLabel,
  categoryToSegment,
  segmentToCategory,
  type EntityCategory,
} from "@/lib/entitySlugs";

const statusMeta = {
  safe: { Icon: ShieldCheck, color: "text-safe", bg: "bg-safe/10", label: "GÜVENLİ" },
  suspicious: { Icon: ShieldQuestion, color: "text-suspicious", bg: "bg-suspicious/10", label: "ŞÜPHELİ" },
  danger: { Icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10", label: "RİSKLİ" },
  neutral: { Icon: ShieldQuestion, color: "text-muted-foreground", bg: "bg-muted", label: "—" },
} as const;

const riskFromRating = (r: number | null | undefined): keyof typeof statusMeta => {
  if (r == null) return "neutral";
  if (r >= 7) return "safe";
  if (r >= 4) return "suspicious";
  return "danger";
};

/**
 * EntityProfile — aggregate page for a target on a given platform.
 * Routes:
 *   /instagram/:slug
 *   /tiktok/:slug
 *   /x/:slug          (twitter category)
 *   /phone/:slug      (slug = masked phone hash)
 *
 * For score we use the dedicated UserProfile page.
 */
const EntityProfile = ({ segment }: { segment: string }) => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const category = segmentToCategory[segment] as EntityCategory | undefined;

  // Resolve slug → target_normalized. For handle-based platforms it's the slug
  // itself (lowercased). For phone we need to scan and match by hash.
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
      // Phone: fetch all phone entries' distinct target_normalized and match by slug.
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
        const t = (row as any).target_normalized as string;
        if (!t || seen.has(t)) continue;
        seen.add(t);
        const s = await buildPhoneSlug(t);
        if (s === slug) {
          if (!cancelled) setResolvedTarget(t);
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
    queryKey: ["entity", category, resolvedTarget],
    enabled: !!category && !!resolvedTarget,
    queryFn: async () => {
      const { data: entries } = await supabase
        .from("entries")
        .select("id, user_id, target, target_normalized, category, description, rating, verified_target, created_at, updated_at")
        .eq("category", category!)
        .eq("target_normalized", resolvedTarget!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      const ids = (entries ?? []).map((e: any) => e.id);
      let commentCount = 0;
      let avgRating: number | null = null;
      if (ids.length > 0) {
        const { count } = await supabase
          .from("comments")
          .select("id", { count: "exact", head: true })
          .in("entry_id", ids)
          .is("deleted_at", null);
        commentCount = count ?? 0;
        const ratings = (entries ?? [])
          .map((e: any) => e.rating)
          .filter((r: any) => typeof r === "number");
        avgRating = ratings.length ? ratings.reduce((s: number, v: number) => s + v, 0) / ratings.length : null;
      }
      return { entries: entries ?? [], commentCount, avgRating };
    },
  });

  // Invalid segment → 404-ish redirect
  if (!category || category === "score") return <Navigate to="/" replace />;

  if (resolvedTarget === undefined || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-8 text-muted-foreground text-sm">{t("table.loading")}</div>
      </div>
    );
  }

  if (resolvedTarget === null || !data || data.entries.length === 0) {
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

  const { entries, commentCount, avgRating } = data;
  const first = entries[0] as any;
  const display = formatTargetDisplay(first.target, category);
  // For phone we never show raw — display the masked slug instead.
  const publicTitle =
    category === "phone" ? `Telefon ${slug}` : display;
  const tone = riskFromRating(avgRating);
  const meta = statusMeta[tone];
  const StatusIcon = meta.Icon;
  const canonical = `/${segment}/${slug}`;

  const seoTitle = `${publicTitle} — ${categoryLabel[category]} güvenilirlik & yorumlar | ${SITE_NAME}`;
  const seoDesc = (
    `${publicTitle} hakkında ${entries.length} entry, ${commentCount} deneyim` +
    (avgRating != null ? `, ortalama puan ${avgRating.toFixed(1)}/10. ` : ". ") +
    `${categoryLabel[category]} hesabı için Score topluluğunun güvenilirlik analizi.`
  ).slice(0, 158);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: seoTitle,
    itemListElement: entries.map((e: any, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/e/${e.id}`,
      name: (e.description ?? "").slice(0, 80),
    })),
  };

  const aggregateLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": category === "phone" ? "Thing" : "Person",
    name: publicTitle,
    url: `${SITE_URL}${canonical}`,
    identifier: category === "phone" ? slug : (first.target_normalized ?? slug),
    sameAs: [],
  };
  if (avgRating != null) {
    aggregateLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avgRating.toFixed(2),
      bestRating: "10",
      worstRating: "1",
      ratingCount: entries.length,
      reviewCount: commentCount,
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
        jsonLd={[aggregateLd, itemListLd, breadcrumbLd]}
      />
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> {t("entry.backToList")}
        </Link>

        <header className="border border-border rounded-lg p-5 bg-card flex items-start gap-4">
          <PlatformIcon category={category} withBg />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-mono text-foreground break-all">{publicTitle}</h1>
              {first.verified_target && (
                <BadgeCheck className="h-4 w-4 text-primary" aria-label={t("entry.verifiedTarget")} />
              )}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${meta.bg} ${meta.color}`}>
                <StatusIcon className="h-3 w-3" /> {meta.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
              {categoryLabel[category]}
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs font-mono text-muted-foreground">
              <span>
                <span className="text-foreground">{entries.length}</span> entry
              </span>
              <span>
                <span className="text-foreground">{commentCount}</span> deneyim
              </span>
              {avgRating != null && (
                <span className="inline-flex items-center gap-1 text-suspicious">
                  <Star className="h-3 w-3 fill-current" /> {avgRating.toFixed(1)}/10
                </span>
              )}
            </div>
          </div>
        </header>

        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mt-6 mb-3">
          Entry'ler
        </h2>
        <ul className="space-y-2">
          {entries.map((e: any) => {
            const t2 = riskFromRating(e.rating);
            const m = statusMeta[t2];
            const SI = m.Icon;
            return (
              <li key={e.id}>
                <Link
                  to={`/e/${e.id}`}
                  className="flex items-center gap-3 p-3 border border-border rounded-md hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{e.description}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {new Date(e.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${m.bg} ${m.color}`}>
                    <SI className="h-3 w-3" /> {m.label}
                  </span>
                  <span className="text-xs font-mono text-suspicious flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {e.rating ?? "—"}
                  </span>
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
};

export default EntityProfile;
