import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  ExternalLink,
  Star,
  Share2,
  Reply,
} from "lucide-react";
import Header from "@/components/Header";
import PlatformIcon from "@/components/PlatformIcon";
import UserHoverCard from "@/components/UserHoverCard";
import UserScore from "@/components/UserScore";
import VoteButtons from "@/components/VoteButtons";
import ContentActionsMenu from "@/components/ContentActionsMenu";
import EditEntryDialog from "@/components/EditEntryDialog";
import EditCommentDialog from "@/components/EditCommentDialog";
import CommentForm from "@/components/CommentForm";
import { extractRatingFromComment, cleanCommentContent } from "@/lib/commentRating";
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
  parent_comment_id: string | null;
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
  score: "Score",
  phone: "Telefon",
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const shareComment = async (commentId: string) => {
    const url = `${window.location.origin}/e/${id}#c-${commentId}`;
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: t("entry.shareCopied") });
      }
    } catch {
      /* user cancelled */
    }
  };

  const submitReply = async (parentCommentId: string) => {
    if (!user || !id) return;
    const text = replyContent.trim();
    if (text.length < 1 || text.length > 2000) return;
    setSendingReply(true);
    const { error } = await supabase.from("comments").insert({
      entry_id: id,
      user_id: user.id,
      content: text,
      is_target_response: true,
      parent_comment_id: parentCommentId,
    } as any);
    setSendingReply(false);
    if (error) {
      toast({ title: t("entry.failed"), description: error.message, variant: "destructive" });
      return;
    }
    setReplyingTo(null);
    setReplyContent("");
    qc.invalidateQueries({ queryKey: ["comments", id] });
  };


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
  // Only top-level comments count toward the 2-per-entry limit
  const myActiveCount = user
    ? activeComments.filter((c) => c.user_id === user.id && !c.parent_comment_id).length
    : 0;
  const remaining = Math.max(0, 2 - myActiveCount);

  // Group replies under their parent. Top-level only paginated.
  const topLevel = allComments.filter((c) => !c.parent_comment_id);
  const repliesByParent = new Map<string, CommentRow[]>();
  allComments.forEach((c) => {
    if (c.parent_comment_id) {
      const arr = repliesByParent.get(c.parent_comment_id) ?? [];
      arr.push(c);
      repliesByParent.set(c.parent_comment_id, arr);
    }
  });
  const pageCount = Math.max(1, Math.ceil(topLevel.length / PAGE_SIZE));
  const pagedComments = topLevel.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);


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

          {/* Anonim kullanıcılar için giriş çağrısı yorumların üstünde kalır */}
          {!user && (
            <div className="border border-border rounded-md p-4 mb-5 text-sm text-muted-foreground">
              <Link to="/auth?mode=signin" className="text-primary hover:underline">{t("header.signIn")}</Link>{" "}
              {t("entry.signInToComment")}
            </div>
          )}

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
                      {/* Header row: name • @handle • verified • time + rating + actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0 min-w-0 text-sm">
                          <UserHoverCard username={username}>
                            <Link
                              to={`/u/${username}`}
                              className="font-semibold text-foreground hover:underline truncate"
                            >
                              @{username}
                            </Link>
                          </UserHoverCard>
                          {!cDeleted && c.is_target_response && (
                            <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" aria-label={t("entry.targetResponse") as string} />
                          )}
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground text-xs">{timeAgo}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
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
                      </div>

                      {/* Rating badge - separate line above comment body */}
                      {!cDeleted && (() => {
                        const r = extractRatingFromComment(c.content);
                        if (r == null) return null;
                        return (
                          <div className="mt-1.5 mb-0.5">
                            <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-md border border-suspicious/30 text-suspicious bg-suspicious/5">
                              <Star className="h-3 w-3 fill-current" />
                              {r}/10
                            </span>
                          </div>
                        );
                      })()}

                      {/* Body */}
                      {cDeleted ? (
                        <p className="mt-1 text-sm italic text-danger/80">
                          {c.deleted_by === c.user_id ? t("moderation.removedByOwner") : t("moderation.removed")}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[15px] leading-snug text-foreground/95 whitespace-pre-wrap break-words">
                          {cleanCommentContent(c.content)}
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

                      {/* Footer: votes + share + reply */}
                      {!cDeleted && (
                        <div className="mt-2 flex items-center gap-1 text-muted-foreground">
                          <VoteButtons commentId={c.id} initialScore={c.vote_score} />
                          <button
                            onClick={() => shareComment(c.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary hover:text-foreground transition-colors text-xs"
                            aria-label={t("entry.share") as string}
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{t("entry.share")}</span>
                          </button>
                          {/* Reply button: only verified target may reply, and not on their own top-level comment */}
                          {user && iVerified && !c.parent_comment_id && (
                            <button
                              onClick={() => {
                                setReplyingTo(replyingTo === c.id ? null : c.id);
                                setReplyContent("");
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary hover:text-foreground transition-colors text-xs"
                              aria-label={t("entry.reply") as string}
                            >
                              <Reply className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">{t("entry.reply")}</span>
                            </button>
                          )}
                          {user && !iVerified && !c.parent_comment_id && (
                            <span className="text-[10px] italic ml-1 text-muted-foreground/70 hidden md:inline">
                              {t("entry.replyOnlyTarget")}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Inline reply form */}
                      {replyingTo === c.id && (
                        <div className="mt-3 border-l-2 border-primary/40 pl-3">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            maxLength={2000}
                            rows={3}
                            placeholder={t("entry.replyPlaceholder") as string}
                            className="w-full text-sm bg-background border border-border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <div className="flex items-center justify-end gap-2 mt-2">
                            <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                              {t("actions.cancel")}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => submitReply(c.id)}
                              disabled={sendingReply || replyContent.trim().length < 1}
                            >
                              {sendingReply ? "..." : t("entry.sendReply")}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Replies (always rendered under their parent) */}
                      {(repliesByParent.get(c.id) ?? []).length > 0 && (
                        <div className="mt-3 space-y-2 border-l-2 border-primary/30 pl-3">
                          {(repliesByParent.get(c.id) ?? []).map((r) => {
                            const rUsername = r.profiles?.username ?? "unknown";
                            const rDeleted = !!r.deleted_at;
                            const rTime = new Date(r.created_at).toLocaleDateString();
                            return (
                              <div key={r.id} className="text-sm bg-primary/5 rounded-md p-2.5">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <UserHoverCard username={rUsername}>
                                    <Link to={`/u/${rUsername}`} className="font-semibold text-foreground hover:underline">
                                      @{rUsername}
                                    </Link>
                                  </UserHoverCard>
                                  <BadgeCheck className="h-3 w-3 text-primary" />
                                  <span>·</span>
                                  <span>{rTime}</span>
                                </div>
                                {rDeleted ? (
                                  <p className="mt-1 italic text-danger/80 text-xs">
                                    {r.deleted_by === r.user_id ? t("moderation.removedByOwner") : t("moderation.removed")}
                                  </p>
                                ) : (
                                  <p className="mt-1 text-foreground/95 whitespace-pre-wrap break-words">
                                    {cleanCommentContent(r.content)}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
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

          {/* Yorum formu — son yorumun altında */}
          {user && !entryDeleted && (
            <div className="mt-6">
              <CommentForm
                entryId={entry.id}
                canReplyAsTarget={iVerified}
                remaining={remaining}
              />
            </div>
          )}
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
