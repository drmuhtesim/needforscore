import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ShieldAlert, ShieldCheck, ShieldQuestion, Star } from "lucide-react";
import Header from "@/components/Header";
import PlatformIcon from "@/components/PlatformIcon";
import GenerationBadge from "@/components/GenerationBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { formatTargetDisplay } from "@/lib/platforms";
import { generationFromOrder } from "@/lib/badges";
import type { CategoryType } from "@/components/CategorySidebar";

const statusMeta = {
  safe: { Icon: ShieldCheck, color: "text-safe", bg: "bg-safe/10" },
  suspicious: { Icon: ShieldQuestion, color: "text-suspicious", bg: "bg-suspicious/10" },
  danger: { Icon: ShieldAlert, color: "text-danger", bg: "bg-danger/10" },
} as const;

const UserProfile = () => {
  const { username } = useParams();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["userProfile", username],
    enabled: !!username,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, created_at, signup_order")
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> {t("entry.backToList")}
        </Link>

        <div className="border border-border rounded-lg p-5 bg-card flex items-start gap-4">
          <Avatar className="h-16 w-16">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
            <AvatarFallback className="bg-primary/10 text-primary font-mono text-base">
              {profile.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-mono text-foreground">@{profile.username}</h1>
              <GenerationBadge generation={generationFromOrder((profile as any).signup_order)} size="md" />
            </div>
            {profile.display_name && <p className="text-sm text-muted-foreground">{profile.display_name}</p>}
            <div className="flex items-center gap-4 mt-3 text-xs font-mono text-muted-foreground">
              <span><span className="text-foreground">{entries.length}</span> {t("profile.entries")}</span>
              <span><span className="text-foreground">{commentCount}</span> {t("profile.comments")}</span>
              <span>{t("profile.joined")} {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mt-6 mb-3">
          {t("profile.entries")}
        </h2>
        <div className="space-y-2">
          {entries.map((e: any) => {
            const s = statusMeta[e.status as keyof typeof statusMeta];
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
                  <StatusIcon className="h-3 w-3" /> {t(`status.${e.status}`)}
                </span>
                <span className="text-xs font-mono text-suspicious flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />{e.rating}
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
