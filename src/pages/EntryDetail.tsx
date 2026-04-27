import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  ExternalLink,
  Star,
} from "lucide-react";
import Header from "@/components/Header";
import PlatformIcon from "@/components/PlatformIcon";
import UserHoverCard from "@/components/UserHoverCard";
import VoteButtons from "@/components/VoteButtons";
import ContentActionsMenu from "@/components/ContentActionsMenu";
import EditEntryDialog from "@/components/EditEntryDialog";
import EditCommentDialog from "@/components/EditCommentDialog";
import UserScore from "@/components/UserScore";
import CommentForm from "@/components/CommentForm";
import { extractRatingFromComment } from "@/lib/commentRating";
import CommentMediaGallery, { type MediaRow } from "@/components/comment-media/CommentMediaGallery";
import Pagination from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { useEntry } from "@/hooks/useEntries";
import { useUserRoles } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { buildProfileUrl, cleanTarget, formatTargetDisplay } from "@/lib/platforms";

interface CommentRow {
  id: string;
  user_id: string;
  content: string;
  is_target_response: boolean;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  profiles?: { username: string; display_name: string | null; avatar_url: string | null; signup_order?: number | null } | null;
  vote_score: number;
}

const PAGE_SIZE = 25;

const platformLabel: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  twitter: "X (Twitter)",
  phone: "Telefon",
  email: "E-posta",
  website: "Web sitesi",
};

const EntryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { isModerator } = useUserRoles();
  const qc = useQueryClient();
  const { data: entry, isLoading } = useEntry(id);
  const [verifying, setVerifying] = useState(false);
  const [iVerified, setIVerified] = useState(false);
  const [editEntryOpen, setEditEntryOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<CommentRow | null>(null);
  const [page, setPage] = useState(1);

  const commentsQ = useQuery({
    queryKey: ["comments", id],
    enabled: !!id,
    queryFn: async (): Promise<CommentRow[]> => {
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("entry_id", id!)
        .order("created_at", { ascending: true });
      const rows = (data ?? []) as unknown as CommentRow[];
      if (rows.length === 0) return rows;
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const ids = rows.map((r) => r.id);
      const [{ data: profiles }, { data: votes }] = await Promise.all([
        supabase.from("profiles").select("user_id, username, display_name, avatar_url, signup_order").in("user_id", userIds),
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

  // Fetch all media for visible comments at once
  const mediaQ = useQuery({
    queryKey: ["comment-media", id, commentsQ.data?.map((c) => c.id).join("|")],
    enabled: !!id && (commentsQ.data?.length ?? 0) > 0,
    queryFn: async (): Promise<MediaRow[]> => {
      const ids = (commentsQ.data ?? []).map((c) => c.id);
      if (ids.length === 0) return [];
      const { data } = await supabase
        .from("comment_media")
        .select("id, comment_id, user_id, storage_path, status")
        .in("comment_id", ids);
      return (data ?? []) as MediaRow[];
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

  // Build media-by-comment map BEFORE any early return so hooks order is stable
  const mediaByComment = useMemo(() => {
    const m = new Map<string, MediaRow[]>();
    (mediaQ.data ?? []).forEach((row) => {
      const arr = m.get(row.comment_id) ?? [];
      arr.push(row);
      m.set(row.comment_id, arr);
    });
    return m;
  }, [mediaQ.data]);

  if (isLoading) return (
    <div className="min-h-screen bg-background"><Header /><div className="p-8 text-muted-foreground text-sm">{t("table.loading")}</div></div>
  );

  if (!entry) return (
    <div className="min-h-screen bg-background"><Header /><div className="p-8 text-muted-foreground text-sm">{t("table.noResults")}</div></div>
  );

  const profileUrl = buildProfileUrl(entry.target, entry.category);
  const targetUsername = cleanTarget(entry.target).toLowerCase();
  const myUsername = profile?.username?.toLowerCase();
  const canClaim =
    !!user &&
    !iVerified &&
    !!myUsername &&
    (entry.category === "instagram" || entry.category === "tiktok" || entry.category === "twitter") &&
    targetUsername === myUsername;

  const isEntryOwner = !!user && entry.user_id === user.id;
  const entryDeleted = !!entry.deleted_at;

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

  const moderateEntry = async () => {
    if (!user || !id) return;
    const { error } = await supabase
      .from("entries")
      .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
      .eq("id", id);
    if (error) {
      toast({ title: t("entry.failed"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("actions.moderatedSuccess") });
    qc.invalidateQueries({ queryKey: ["entries"] });
    navigate("/", { replace: true });
  };

  const deleteComment = async (commentId: string, asMod: boolean) => {
    if (!user) return;
    const { error } = await supabase
      .from("comments")
      .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
      .eq("id", commentId);
    if (error) {
      toast({ title: t("entry.failed"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: asMod ? t("actions.moderatedSuccess") : t("actions.deletedSuccess") });
    qc.invalidateQueries({ queryKey: ["comments", id] });
  };

  const allComments = commentsQ.data ?? [];
  const activeComments = allComments.filter((c) => !c.deleted_at);
  const myActiveCount = user ? activeComments.filter((c) => c.user_id === user.id).length : 0;
  const remaining = Math.max(0, 2 - myActiveCount);
  const pageCount = Math.max(1, Math.ceil(allComments.length / PAGE_SIZE));
  const pagedComments = allComments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> {t("entry.backToList")}
        </Link>

        {/* Entry card — başlık */}
        <div className={`relative border rounded-xl p-6 bg-card ${entryDeleted ? "border-danger/40 bg-danger/5" : "border-border"}`}>
          {/* Sağ üstte sadece deneyim sayısı (rakam) */}
          {!entryDeleted && (
            <span
              className="absolute top-3 right-4 text-xs font-mono text-muted-foreground"
              title={t("entry.comments") as string}
            >
              {activeComments.length}
            </span>
          )}
          {entryDeleted && (
            <div className="mb-4 text-xs font-mono text-danger uppercase tracking-wider">
              {t("moderation.removed")}
            </div>
          )}
          <div className="flex items-start gap-3">
            <PlatformIcon category={entry.category} className="h-5 w-5" withBg />
            <div className="flex-1 min-w-0">
              {/* Title row */}
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-mono text-lg sm:text-xl text-foreground break-all">
                  {formatTargetDisplay(entry.target, entry.category)}
                </h1>
                {entry.verified_target && (
                  <span className="inline-flex items-center gap-1 text-xs text-primary">
                    <BadgeCheck className="h-3.5 w-3.5" /> {t("entry.verifiedTarget")}
                  </span>
                )}
              </div>

              {/* Profile meta block under the title — platform + link */}
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground/70">
                    {platformLabel[entry.category] ?? entry.category}
                  </span>
                  {profileUrl && (
                    <a
                      href={profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {t("entry.openProfile")} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Rating only */}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="inline-flex items-center gap-1 text-xs font-mono text-suspicious" title={t("entry.avgRatingTitle")}>
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {entry.avg_rating != null ? `${entry.avg_rating.toFixed(1)}/10` : "—"}
                </span>
              </div>

              {/* Bottom: opener author left, actions right.
                  Note: opener can edit but CANNOT delete the entry. Only moderators can. */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  {entry.profiles?.username ? (
                    <>
                      <span>{t("entry.by")}</span>
                      <UserHoverCard username={entry.profiles.username}>
                        <span className="text-foreground/80 hover:text-primary">@{entry.profiles.username}</span>
                      </UserHoverCard>
                      <UserScore userId={entry.user_id} />
                    </>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <VoteButtons entryId={entry.id} initialScore={entry.vote_score ?? 0} size="md" />
                  {canClaim && (
                    <Button size="sm" variant="outline" onClick={claimAsTarget} disabled={verifying}>
                      <BadgeCheck className="h-4 w-4 mr-1" />
                      {verifying ? "..." : t("entry.claimAsMe")}
                    </Button>
                  )}
                  {!entryDeleted && (
                    <ContentActionsMenu
                      canEdit={isEntryOwner}
                      canDelete={false}
                      canModerate={isModerator}
                      onEdit={() => setEditEntryOpen(true)}
                      onModerate={moderateEntry}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Experiences section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("entry.comments")}
            </h2>
          </div>

          {/* Comment / experience form */}
          {user && !entryDeleted ? (
            <CommentForm
              entryId={entry.id}
              canReplyAsTarget={iVerified}
              remaining={remaining}
            />
          ) : !user ? (
            <div className="border border-border rounded-md p-4 mb-5 text-sm text-muted-foreground">
              <Link to="/auth?mode=signin" className="text-primary hover:underline">{t("header.signIn")}</Link>{" "}
              {t("entry.signInToComment")}
            </div>
          ) : null}

          {/* Comment list — Twitter/X style cards */}
          <div className="divide-y divide-border/60 border-y border-border/60">
            {pagedComments.map((c) => {
              const isOwner = !!user && c.user_id === user.id;
              const cDeleted = !!c.deleted_at;
              const media = mediaByComment.get(c.id) ?? [];
              const username = c.profiles?.username ?? "unknown";
              const displayName = c.profiles?.display_name || username;
              const avatarLetter = (displayName || username).charAt(0).toUpperCase();
              const timeAgo = new Date(c.created_at).toLocaleDateString();
              return (
                <article
                  key={c.id}
                  className={`relative px-3 sm:px-4 py-3 transition-colors ${
                    cDeleted
                      ? "bg-danger/5"
                      : c.is_target_response
                        ? "bg-primary/5"
                        : "hover:bg-card/40"
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <UserHoverCard username={username}>
                      <Link
                        to={`/u/${username}`}
                        className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-border flex items-center justify-center text-sm font-semibold text-foreground/80 hover:opacity-90"
                      >
                        {c.profiles?.avatar_url ? (
                          <img
                            src={c.profiles.avatar_url}
                            alt={username}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          avatarLetter
                        )}
                      </Link>
                    </UserHoverCard>

                    <div className="flex-1 min-w-0">
                      {/* Header row: name • @handle • verified • time + actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0 min-w-0 text-sm">
                          <UserHoverCard username={username}>
                            <Link
                              to={`/u/${username}`}
                              className="font-semibold text-foreground hover:underline truncate"
                            >
                              {displayName}
                            </Link>
                          </UserHoverCard>
                          {!cDeleted && c.is_target_response && (
                            <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" aria-label={t("entry.targetResponse") as string} />
                          )}
                          <span className="text-muted-foreground truncate">@{username}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground text-xs">{timeAgo}</span>
                        </div>
                        {!cDeleted && (
                          <ContentActionsMenu
                            canEdit={isOwner}
                            canDelete={isOwner}
                            canModerate={!isOwner && isModerator}
                            onEdit={() => setEditingComment(c)}
                            onDelete={() => deleteComment(c.id, false)}
                            onModerate={() => deleteComment(c.id, true)}
                          />
                        )}
                      </div>

                      {/* Body */}
                      {cDeleted ? (
                        <p className="mt-1 text-sm italic text-danger/80">
                          {c.deleted_by === c.user_id ? t("moderation.removedByOwner") : t("moderation.removed")}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[15px] leading-snug text-foreground/95 whitespace-pre-wrap break-words">
                          {c.content}
                        </p>
                      )}

                      {/* Media */}
                      {!cDeleted && (
                        <div className="mt-2">
                          <CommentMediaGallery
                            media={media}
                            isOwner={isOwner}
                            isModerator={isModerator}
                            commentId={c.id}
                          />
                        </div>
                      )}

                      {/* Footer: votes + score badge */}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <VoteButtons commentId={c.id} initialScore={c.vote_score} />
                        <UserScoreBadge userId={c.user_id} />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
            {allComments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">{t("entry.noComments")}</p>
            )}
          </div>

          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      </div>

      {/* Dialogs */}
      <EditEntryDialog
        open={editEntryOpen}
        onOpenChange={setEditEntryOpen}
        entryId={entry.id}
        initial={{ description: entry.description, rating: entry.rating }}
      />
      {editingComment && (
        <EditCommentDialog
          open={!!editingComment}
          onOpenChange={(v) => !v && setEditingComment(null)}
          commentId={editingComment.id}
          entryId={entry.id}
          initialContent={editingComment.content}
        />
      )}
    </div>
  );
};

export default EntryDetail;
