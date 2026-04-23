import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, ExternalLink, ShieldAlert, ShieldCheck, ShieldQuestion, Star } from "lucide-react";
import Header from "@/components/Header";
import PlatformIcon from "@/components/PlatformIcon";
import UserHoverCard from "@/components/UserHoverCard";
import VoteButtons from "@/components/VoteButtons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEntry } from "@/hooks/useEntries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { buildProfileUrl, cleanTarget, formatTargetDisplay } from "@/lib/platforms";

const statusMeta = {
  safe: { Icon: ShieldCheck, color: "text-safe", bg: "bg-safe/10" },
  suspicious: { Icon: ShieldQuestion, color: "text-suspicious", bg: "bg-suspicious/10" },
  danger: { Icon: ShieldAlert, color: "text-danger", bg: "bg-danger/10" },
} as const;

interface CommentRow {
  id: string;
  user_id: string;
  content: string;
  is_target_response: boolean;
  created_at: string;
  profiles?: { username: string; display_name: string | null; avatar_url: string | null } | null;
  vote_score: number;
}

const EntryDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const { data: entry, isLoading } = useEntry(id);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [iVerified, setIVerified] = useState(false);

  const commentsQ = useQuery({
    queryKey: ["comments", id],
    enabled: !!id,
    queryFn: async (): Promise<CommentRow[]> => {
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("entry_id", id!)
        .order("created_at", { ascending: true });
      const rows = (data ?? []) as CommentRow[];
      if (rows.length === 0) return rows;
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const ids = rows.map((r) => r.id);
      const [{ data: profiles }, { data: votes }] = await Promise.all([
        supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", userIds),
        supabase.from("votes").select("comment_id, value").in("comment_id", ids),
      ]);
      const pm = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      const vm = new Map<string, number>();
      (votes ?? []).forEach((v) => {
        if (!v.comment_id) return;
        vm.set(v.comment_id, (vm.get(v.comment_id) ?? 0) + v.value);
      });
      return rows.map((r) => ({
        ...r,
        profiles: (pm.get(r.user_id) as any) ?? null,
        vote_score: vm.get(r.id) ?? 0,
      }));
    },
  });

  // Check if I (user) have verified myself as target on this entry
  useEffect(() => {
    if (!user || !id) {
      setIVerified(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("target_verifications")
        .select("id")
        .eq("entry_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      setIVerified(!!data);
    })();
  }, [user, id]);

  if (isLoading) return (
    <div className="min-h-screen bg-background"><Header /><div className="p-8 text-muted-foreground text-sm">{t("table.loading")}</div></div>
  );

  if (!entry) return (
    <div className="min-h-screen bg-background"><Header /><div className="p-8 text-muted-foreground text-sm">{t("table.noResults")}</div></div>
  );

  const status = statusMeta[entry.status];
  const StatusIcon = status.Icon;
  const profileUrl = buildProfileUrl(entry.target, entry.category);
  const targetUsername = cleanTarget(entry.target).toLowerCase();
  const myUsername = profile?.username?.toLowerCase();
  const canClaim =
    !!user &&
    !iVerified &&
    !!myUsername &&
    (entry.category === "instagram" || entry.category === "tiktok" || entry.category === "twitter") &&
    targetUsername === myUsername;

  const claimAsTarget = async () => {
    if (!user || !id) return;
    setVerifying(true);
    const { error } = await supabase.from("target_verifications").insert({ entry_id: id, user_id: user.id });
    setVerifying(false);
    if (error) {
      toast({ title: t("entry.failed"), description: error.message, variant: "destructive" });
      return;
    }
    setIVerified(true);
    toast({ title: t("entry.verifiedTitle"), description: t("entry.verifiedDesc") });
    qc.invalidateQueries({ queryKey: ["entry", id] });
  };

  const submitComment = async (asTarget: boolean) => {
    if (!user || !id) return;
    const text = comment.trim();
    if (text.length < 1 || text.length > 2000) {
      toast({ title: t("entry.invalidInput"), variant: "destructive" });
      return;
    }
    setPosting(true);
    const { error } = await supabase.from("comments").insert({
      entry_id: id,
      user_id: user.id,
      content: text,
      is_target_response: asTarget,
    });
    setPosting(false);
    if (error) {
      toast({ title: t("entry.failed"), description: error.message, variant: "destructive" });
      return;
    }
    setComment("");
    qc.invalidateQueries({ queryKey: ["comments", id] });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> {t("entry.backToList")}
        </Link>

        {/* Entry card */}
        <div className="border border-border rounded-lg p-5 bg-card">
          <div className="flex items-start gap-4">
            <PlatformIcon category={entry.category} className="h-6 w-6" withBg />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-mono text-xl text-foreground break-all">
                  {formatTargetDisplay(entry.target, entry.category)}
                </h1>
                {entry.verified_target && (
                  <span className="inline-flex items-center gap-1 text-xs text-primary">
                    <BadgeCheck className="h-3.5 w-3.5" /> {t("entry.verifiedTarget")}
                  </span>
                )}
                {profileUrl && (
                  <a href={profileUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                    {t("entry.openProfile")} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                  <StatusIcon className="h-3.5 w-3.5" /> {t(`status.${entry.status}`)}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-mono text-suspicious">
                  <Star className="h-3.5 w-3.5 fill-current" /> {entry.rating}/10
                </span>
                {entry.profiles?.username && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {t("entry.by")} <UserHoverCard username={entry.profiles.username}><span>@{entry.profiles.username}</span></UserHoverCard>
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm text-foreground/90 whitespace-pre-wrap">{entry.description}</p>
              <div className="mt-4 flex items-center gap-4">
                <VoteButtons entryId={entry.id} initialScore={entry.vote_score ?? 0} size="md" />
                {canClaim && (
                  <Button size="sm" variant="outline" onClick={claimAsTarget} disabled={verifying}>
                    <BadgeCheck className="h-4 w-4 mr-1" />
                    {verifying ? "..." : t("entry.claimAsMe")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {t("entry.comments")} ({commentsQ.data?.length ?? 0})
          </h2>

          {/* Comment form */}
          {user ? (
            <div className="space-y-2 mb-5">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("entry.commentPlaceholder")}
                rows={3}
                maxLength={2000}
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground font-mono">{comment.length}/2000</p>
                <div className="flex items-center gap-2">
                  {iVerified && (
                    <Button size="sm" variant="outline" onClick={() => submitComment(true)} disabled={posting || !comment.trim()}>
                      <BadgeCheck className="h-3.5 w-3.5 mr-1 text-primary" />
                      {t("entry.replyAsTarget")}
                    </Button>
                  )}
                  <Button size="sm" onClick={() => submitComment(false)} disabled={posting || !comment.trim()}>
                    {posting ? "..." : t("entry.postComment")}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-border rounded-md p-4 mb-5 text-sm text-muted-foreground">
              <Link to="/auth?mode=signin" className="text-primary hover:underline">{t("header.signIn")}</Link>{" "}
              {t("entry.signInToComment")}
            </div>
          )}

          {/* Comment list */}
          <div className="space-y-3">
            {(commentsQ.data ?? []).map((c) => (
              <div
                key={c.id}
                className={`border rounded-md p-3 ${c.is_target_response ? "border-primary/40 bg-primary/5" : "border-border bg-card/50"}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    {c.profiles?.username ? (
                      <UserHoverCard username={c.profiles.username}>
                        <span className="text-foreground">@{c.profiles.username}</span>
                      </UserHoverCard>
                    ) : (
                      <span className="text-muted-foreground">@unknown</span>
                    )}
                    {c.is_target_response && (
                      <span className="inline-flex items-center gap-1 text-xs text-primary">
                        <BadgeCheck className="h-3 w-3" /> {t("entry.targetResponse")}
                      </span>
                    )}
                  </div>
                  <VoteButtons commentId={c.id} initialScore={c.vote_score} />
                </div>
                <p className="text-sm whitespace-pre-wrap">{c.content}</p>
              </div>
            ))}
            {commentsQ.data?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">{t("entry.noComments")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntryDetail;
