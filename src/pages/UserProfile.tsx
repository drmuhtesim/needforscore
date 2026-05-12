import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ShieldAlert, ShieldCheck, ShieldQuestion, Star, MessageSquare, Pencil, MapPin, Briefcase, Cake } from "lucide-react";
import Header from "@/components/Header";
import PlatformIcon from "@/components/PlatformIcon";
import UserScore from "@/components/UserScore";
import LinkedAccountsPanel from "@/components/LinkedAccountsPanel";
import ProfileEditDialog from "@/components/ProfileEditDialog";
import ErrorBoundary from "@/components/ErrorBoundary";
import SEO, { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/components/SEO";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatTargetDisplay } from "@/lib/platforms";
import { useAuth } from "@/contexts/AuthContext";
import type { CategoryType } from "@/components/CategorySidebar";

const statusMeta = {
  safe: { Icon: ShieldCheck, color: "text-safe", bg: "bg-safe/10" },
  suspicious: { Icon: ShieldQuestion, color: "text-suspicious", bg: "bg-suspicious/10" },
  danger: { Icon: ShieldAlert, color: "text-danger", bg: "bg-danger/10" },
  neutral: { Icon: ShieldQuestion, color: "text-muted-foreground", bg: "bg-muted" },
} as const;

const riskFromRating = (r: number | null | undefined): keyof typeof statusMeta => {
  if (r == null) return "neutral";
  if (r >= 7) return "safe";
  if (r >= 4) return "suspicious";
  return "danger";
};

const UserProfile = () => {
  const { username } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["userProfile", username],
    enabled: !!username,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, created_at, signup_order, city, occupation, age, bio, show_avatar, show_display_name, show_city, show_occupation, show_age, show_bio, show_linked_accounts")
        .eq("username", username!)
        .maybeSingle();
      if (!profile) return null;
      const [{ data: entries }, { count: commentCount }] = await Promise.all([
        supabase.from("entries").select("*").eq("user_id", profile.user_id).is("deleted_at", null).order("created_at", { ascending: false }).limit(50),
        supabase.from("comments").select("id", { count: "exact", head: true }).eq("user_id", profile.user_id).is("deleted_at", null),
      ]);
      return { profile, entries: entries ?? [], commentCount: commentCount ?? 0 };
    },
  });

  if (isLoading) {
    return <div className="min-h-screen bg-background"><Header /><div className="p-8 text-muted-foreground text-sm">{t("table.loading")}</div></div>;
  }
  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-3xl mx-auto p-8">
          <p className="text-muted-foreground">{t("profile.notFound")}</p>
          <Link to="/" className="text-primary text-sm hover:underline mt-2 inline-block">← {t("entry.backToList")}</Link>
        </div>
      </div>
    );
  }

  const { profile, entries, commentCount } = data;

  // SEO derivations
  const ratedEntries = (entries as any[]).filter((e) => typeof e.rating === "number");
  const avgRating =
    ratedEntries.length > 0
      ? ratedEntries.reduce((s, e) => s + (e.rating ?? 0), 0) / ratedEntries.length
      : null;
  const categories = Array.from(new Set((entries as any[]).map((e) => e.category))).filter(Boolean);
  const profileUrl = `${SITE_URL}/u/${profile.username}`;
  const displayName = (profile as any).show_display_name && profile.display_name ? profile.display_name : profile.username;
  const seoTitle = `@${profile.username} — ${displayName} | ${SITE_NAME}`;
  const bio = (profile as any).show_bio ? (profile as any).bio : null;
  const seoDesc = bio
    ? String(bio).slice(0, 155)
    : `@${profile.username} kullanıcısının Score profili: ${entries.length} entry, ${commentCount} deneyim${
        avgRating != null ? `, ortalama puan ${avgRating.toFixed(1)}/10` : ""
      }. ${categories.length ? `Kategoriler: ${categories.join(", ")}.` : ""}`.slice(0, 155);
  const ogImage = ((profile as any).show_avatar && profile.avatar_url) || DEFAULT_OG_IMAGE;

  const personLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
    alternateName: profile.username,
    url: profileUrl,
    identifier: profile.username,
  };
  if ((profile as any).show_avatar && profile.avatar_url) personLd.image = profile.avatar_url;
  if (bio) personLd.description = bio;
  if ((profile as any).show_city && (profile as any).city) {
    personLd.address = { "@type": "PostalAddress", addressLocality: (profile as any).city };
  }
  if ((profile as any).show_occupation && (profile as any).occupation) {
    personLd.jobTitle = (profile as any).occupation;
  }
  if (avgRating != null && ratedEntries.length > 0) {
    personLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avgRating.toFixed(2),
      bestRating: "10",
      worstRating: "1",
      ratingCount: ratedEntries.length,
      reviewCount: commentCount,
    };
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Kullanıcılar", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 3, name: `@${profile.username}`, item: profileUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoTitle}
        description={seoDesc}
        canonical={`/score/${profile.username}`}
        image={ogImage}
        type="profile"
        jsonLd={[personLd, breadcrumbLd]}
      />
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> {t("entry.backToList")}
        </Link>

        {(() => {
          const isOwner = !!user && user.id === profile.user_id;
          const p: any = profile;
          const canShow = (key: string) => isOwner || !!p[key];
          const showAvatar = canShow("show_avatar") && profile.avatar_url;
          const showDisplayName = canShow("show_display_name") && profile.display_name;
          const showCity = canShow("show_city") && p.city;
          const showOccupation = canShow("show_occupation") && p.occupation;
          const showAge = canShow("show_age") && p.age != null;
          const showBio = canShow("show_bio") && p.bio;
          return (
        <div className="border border-border rounded-lg p-5 bg-card flex items-start gap-4">
          <Avatar className="h-16 w-16">
            {showAvatar && <AvatarImage src={profile.avatar_url!} />}
            <AvatarFallback className="bg-primary/10 text-primary font-mono text-base">
              {profile.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-mono text-foreground">@{profile.username}</h1>
              <UserScore userId={profile.user_id} size="md" />
            </div>
            {showDisplayName && <p className="text-sm text-muted-foreground">{profile.display_name}</p>}

            {/* Extra profile fields */}
            {(showCity || showOccupation || showAge) && (
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                {showCity && (
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{p.city}</span>
                )}
                {showOccupation && (
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{p.occupation}</span>
                )}
                {showAge && (
                  <span className="inline-flex items-center gap-1"><Cake className="h-3 w-3" />{p.age}</span>
                )}
              </div>
            )}
            {showBio && (
              <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap break-words">{p.bio}</p>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs font-mono text-muted-foreground">
              <span><span className="text-foreground">{entries.length}</span> {t("profile.entries")}</span>
              <span><span className="text-foreground">{commentCount}</span> {t("profile.comments")}</span>
              <span>{t("profile.joined")} {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          {isOwner ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditOpen(true)}
              className="gap-1.5"
            >
              <Pencil className="h-4 w-4" />
              {t("profile.edit.button")}
            </Button>
          ) : user ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/messages?to=${profile.username}`)}
              className="gap-1.5"
            >
              <MessageSquare className="h-4 w-4" />
              {t("messages.sendTo")}
            </Button>
          ) : null}
        </div>
          );
        })()}

        {user && user.id === profile.user_id && (
          <ProfileEditDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            initial={{
              user_id: profile.user_id,
              username: profile.username,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              city: (profile as any).city ?? null,
              occupation: (profile as any).occupation ?? null,
              age: (profile as any).age ?? null,
              bio: (profile as any).bio ?? null,
              show_avatar: (profile as any).show_avatar ?? false,
              show_display_name: (profile as any).show_display_name ?? false,
              show_city: (profile as any).show_city ?? false,
              show_occupation: (profile as any).show_occupation ?? false,
              show_age: (profile as any).show_age ?? false,
              show_bio: (profile as any).show_bio ?? false,
              show_linked_accounts: (profile as any).show_linked_accounts ?? false,
            }}
          />
        )}

        {user && user.id === profile.user_id && (
          <div className="mt-4">
            <ErrorBoundary label="LinkedAccountsPanel">
              <LinkedAccountsPanel />
            </ErrorBoundary>
          </div>
        )}

        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mt-6 mb-3">
          {t("profile.entries")}
        </h2>
        <div className="space-y-2">
          {entries.map((e: any) => {
            const tone = riskFromRating(e.rating);
            const s = statusMeta[tone];
            const StatusIcon = s.Icon;
            return (
              <Link
                to={`/e/${e.id}`}
                key={e.id}
                className="flex items-center gap-3 p-3 border border-border rounded-md hover:bg-secondary/40 transition-colors"
              >
                <PlatformIcon category={e.category as CategoryType} withBg />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm truncate">{formatTargetDisplay(e.target, e.category)}</p>
                  <p className="text-xs text-muted-foreground truncate">{e.description}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${s.bg} ${s.color}`}>
                  <StatusIcon className="h-3 w-3" /> {t(`status.${tone}`)}
                </span>
                <span className="text-xs font-mono text-suspicious flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />{e.rating ?? "—"}
                </span>
              </Link>
            );
          })}
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">{t("entry.noEntries")}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
