import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, Ban, RotateCcw, Trash2, Check, X as XIcon, ExternalLink, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRole";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type EntryRow = {
  id: string; user_id: string; target: string; category: string; description: string;
  created_at: string; deleted_at: string | null; deleted_by: string | null;
  profiles?: { username: string | null } | null;
};
type CommentRow = {
  id: string; user_id: string; entry_id: string; content: string; created_at: string;
  deleted_at: string | null; deleted_by: string | null;
  profiles?: { username: string | null } | null;
};
type MediaRow = {
  id: string; comment_id: string; user_id: string; storage_path: string;
  status: "pending" | "approved" | "rejected"; created_at: string;
  profiles?: { username: string | null } | null;
};
type ProfileRow = {
  id: string; user_id: string; username: string; display_name: string | null;
  is_banned: boolean; banned_at: string | null; ban_reason: string | null; created_at: string;
};

const fmt = (s: string | null) => (s ? new Date(s).toLocaleString("tr-TR") : "—");

const entryUrl = (e: EntryRow) => {
  const seg = e.category === "twitter" ? "x" : e.category;
  if (seg === "score") return `/score/${e.target}`;
  return `/${seg}/${encodeURIComponent(e.target)}`;
};

const ModDashboard = () => {
  const { user, loading } = useAuth();
  const { isModerator, loading: rolesLoading } = useUserRoles();
  const qc = useQueryClient();
  const [tab, setTab] = useState("pending-media");

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-8 text-sm text-muted-foreground">Yükleniyor…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth?mode=signin" replace />;
  if (!isModerator) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-suspicious to-danger flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Moderasyon Paneli</h1>
            <p className="text-sm text-muted-foreground">Topluluğu güvende tut. İçerik ve hesap işlemleri burada.</p>
          </div>
        </div>

        <StatsRow />

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto">
            <TabsTrigger value="pending-media">Bekleyen medya</TabsTrigger>
            <TabsTrigger value="entries">Son başlıklar</TabsTrigger>
            <TabsTrigger value="comments">Son yorumlar</TabsTrigger>
            <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
            <TabsTrigger value="actions">Geçmişim</TabsTrigger>
          </TabsList>

          <TabsContent value="pending-media" className="mt-4"><PendingMediaTab /></TabsContent>
          <TabsContent value="entries" className="mt-4"><EntriesTab /></TabsContent>
          <TabsContent value="comments" className="mt-4"><CommentsTab /></TabsContent>
          <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
          <TabsContent value="actions" className="mt-4"><MyActionsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const StatsRow = () => {
  const { data } = useQuery({
    queryKey: ["mod-stats"],
    queryFn: async () => {
      const [pendingMedia, openEntries, deletedEntries, bannedUsers] = await Promise.all([
        supabase.from("comment_media").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("entries").select("id", { count: "exact", head: true }).is("deleted_at", null),
        supabase.from("entries").select("id", { count: "exact", head: true }).not("deleted_at", "is", null),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_banned", true),
      ]);
      return {
        pendingMedia: pendingMedia.count ?? 0,
        openEntries: openEntries.count ?? 0,
        deletedEntries: deletedEntries.count ?? 0,
        bannedUsers: bannedUsers.count ?? 0,
      };
    },
  });
  const items = [
    { label: "Bekleyen medya", value: data?.pendingMedia ?? "—", color: "text-suspicious" },
    { label: "Aktif başlık", value: data?.openEntries ?? "—", color: "text-foreground" },
    { label: "Silinmiş başlık", value: data?.deletedEntries ?? "—", color: "text-danger" },
    { label: "Banlı kullanıcı", value: data?.bannedUsers ?? "—", color: "text-danger" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((it) => (
        <Card key={it.label} className="p-4">
          <div className="text-xs text-muted-foreground font-mono uppercase tracking-wide">{it.label}</div>
          <div className={`text-2xl font-extrabold mt-1 ${it.color}`}>{String(it.value)}</div>
        </Card>
      ))}
    </div>
  );
};

/* ---------------- Pending Media ---------------- */
const PendingMediaTab = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["mod-pending-media"],
    queryFn: async () => {
      const { data } = await supabase
        .from("comment_media")
        .select("id, comment_id, user_id, storage_path, status, created_at, profiles:profiles!inner(username)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as unknown as MediaRow[];
    },
  });
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    (async () => {
      if (!data) return;
      const next: Record<string, string> = {};
      await Promise.all(data.map(async (m) => {
        const { data: s } = await supabase.storage.from("comment-media").createSignedUrl(m.storage_path, 1800);
        if (s?.signedUrl) next[m.id] = s.signedUrl;
      }));
      setUrls(next);
    })();
  }, [data]);

  const decide = async (id: string, status: "approved" | "rejected") => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("comment_media").update({ status, moderator_id: u.user?.id }).eq("id", id);
    if (error) return toast({ title: "Hata", description: error.message, variant: "destructive" });
    toast({ title: status === "approved" ? "Onaylandı" : "Reddedildi" });
    qc.invalidateQueries({ queryKey: ["mod-pending-media"] });
    qc.invalidateQueries({ queryKey: ["mod-stats"] });
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Yükleniyor…</div>;
  if (!data?.length) return <Card className="p-8 text-center text-sm text-muted-foreground">Bekleyen medya yok 🎉</Card>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {data.map((m) => (
        <Card key={m.id} className="overflow-hidden">
          <div className="aspect-square bg-muted/30">
            {urls[m.id] ? <img src={urls[m.id]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-6 w-6 text-muted-foreground" /></div>}
          </div>
          <div className="p-3 space-y-2">
            <div className="text-xs font-mono text-muted-foreground truncate">@{m.profiles?.username ?? "?"}</div>
            <div className="text-[10px] text-muted-foreground">{fmt(m.created_at)}</div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => decide(m.id, "approved")}><Check className="h-3 w-3 mr-1" />Onayla</Button>
              <Button size="sm" variant="destructive" className="flex-1" onClick={() => decide(m.id, "rejected")}><XIcon className="h-3 w-3 mr-1" />Reddet</Button>
            </div>
            <Link to={`/e/${m.comment_id}`} className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
              Yoruma git <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
};

/* ---------------- Entries ---------------- */
const EntriesTab = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"active" | "deleted" | "all">("active");
  const { data, isLoading } = useQuery({
    queryKey: ["mod-entries", filter],
    queryFn: async () => {
      let q = supabase
        .from("entries")
        .select("id, user_id, target, category, description, created_at, deleted_at, deleted_by, profiles:profiles!inner(username)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (filter === "active") q = q.is("deleted_at", null);
      if (filter === "deleted") q = q.not("deleted_at", "is", null);
      const { data } = await q;
      return (data ?? []) as unknown as EntryRow[];
    },
  });

  const softDelete = async (id: string) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("entries").update({ deleted_at: new Date().toISOString(), deleted_by: u.user?.id }).eq("id", id);
    if (error) return toast({ title: "Hata", description: error.message, variant: "destructive" });
    toast({ title: "Başlık moderatör tarafından silindi" });
    qc.invalidateQueries({ queryKey: ["mod-entries"] });
    qc.invalidateQueries({ queryKey: ["mod-stats"] });
  };

  const restore = async (id: string) => {
    const { error } = await supabase.from("entries").update({ deleted_at: null, deleted_by: null }).eq("id", id);
    if (error) return toast({ title: "Hata", description: error.message, variant: "destructive" });
    toast({ title: "Başlık geri yüklendi" });
    qc.invalidateQueries({ queryKey: ["mod-entries"] });
    qc.invalidateQueries({ queryKey: ["mod-stats"] });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["active", "deleted", "all"] as const).map((k) => (
          <Button key={k} variant={filter === k ? "default" : "outline"} size="sm" onClick={() => setFilter(k)}>
            {k === "active" ? "Aktif" : k === "deleted" ? "Silinmiş" : "Tümü"}
          </Button>
        ))}
      </div>
      {isLoading ? <div className="text-sm text-muted-foreground">Yükleniyor…</div> :
        !data?.length ? <Card className="p-8 text-center text-sm text-muted-foreground">Kayıt yok.</Card> :
          <div className="space-y-2">
            {data.map((e) => (
              <Card key={e.id} className={`p-4 ${e.deleted_at ? "opacity-60 border-danger/40" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="font-mono">{e.category}</Badge>
                      <Link to={entryUrl(e)} className="font-bold text-foreground hover:text-primary truncate">{e.target}</Link>
                      {e.deleted_at && <Badge variant="destructive">silinmiş</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{e.description}</p>
                    <div className="text-[11px] text-muted-foreground font-mono mt-1">
                      @{e.profiles?.username} • {fmt(e.created_at)}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {e.deleted_at ? (
                      <Button size="sm" variant="outline" onClick={() => restore(e.id)}><RotateCcw className="h-3 w-3 mr-1" />Geri yükle</Button>
                    ) : (
                      <Button size="sm" variant="destructive" onClick={() => softDelete(e.id)}><Trash2 className="h-3 w-3 mr-1" />Sil</Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
      }
    </div>
  );
};

/* ---------------- Comments ---------------- */
const CommentsTab = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"active" | "deleted" | "all">("active");
  const { data, isLoading } = useQuery({
    queryKey: ["mod-comments", filter],
    queryFn: async () => {
      let q = supabase
        .from("comments")
        .select("id, user_id, entry_id, content, created_at, deleted_at, deleted_by, profiles:profiles!inner(username)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (filter === "active") q = q.is("deleted_at", null);
      if (filter === "deleted") q = q.not("deleted_at", "is", null);
      const { data } = await q;
      return (data ?? []) as unknown as CommentRow[];
    },
  });

  const softDelete = async (id: string) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("comments").update({ deleted_at: new Date().toISOString(), deleted_by: u.user?.id }).eq("id", id);
    if (error) return toast({ title: "Hata", description: error.message, variant: "destructive" });
    toast({ title: "Yorum moderatör tarafından silindi" });
    qc.invalidateQueries({ queryKey: ["mod-comments"] });
  };
  const restore = async (id: string) => {
    const { error } = await supabase.from("comments").update({ deleted_at: null, deleted_by: null }).eq("id", id);
    if (error) return toast({ title: "Hata", description: error.message, variant: "destructive" });
    toast({ title: "Yorum geri yüklendi" });
    qc.invalidateQueries({ queryKey: ["mod-comments"] });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["active", "deleted", "all"] as const).map((k) => (
          <Button key={k} variant={filter === k ? "default" : "outline"} size="sm" onClick={() => setFilter(k)}>
            {k === "active" ? "Aktif" : k === "deleted" ? "Silinmiş" : "Tümü"}
          </Button>
        ))}
      </div>
      {isLoading ? <div className="text-sm text-muted-foreground">Yükleniyor…</div> :
        !data?.length ? <Card className="p-8 text-center text-sm text-muted-foreground">Kayıt yok.</Card> :
          <div className="space-y-2">
            {data.map((c) => (
              <Card key={c.id} className={`p-4 ${c.deleted_at ? "opacity-60 border-danger/40" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-muted-foreground font-mono">
                      @{c.profiles?.username} • {fmt(c.created_at)}
                      {c.deleted_at && <span className="text-danger ml-2">silinmiş</span>}
                    </div>
                    <p className="text-sm mt-1 line-clamp-3">{c.content}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {c.deleted_at ? (
                      <Button size="sm" variant="outline" onClick={() => restore(c.id)}><RotateCcw className="h-3 w-3 mr-1" />Geri yükle</Button>
                    ) : (
                      <Button size="sm" variant="destructive" onClick={() => softDelete(c.id)}><Trash2 className="h-3 w-3 mr-1" />Sil</Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
      }
    </div>
  );
};

/* ---------------- Users (ban / unban) ---------------- */
const UsersTab = () => {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [view, setView] = useState<"banned" | "search">("banned");
  const [confirm, setConfirm] = useState<{ p: ProfileRow; ban: boolean } | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["mod-users", view, q],
    queryFn: async () => {
      let query = supabase.from("profiles")
        .select("id, user_id, username, display_name, is_banned, banned_at, ban_reason, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (view === "banned") query = query.eq("is_banned", true);
      else if (q.trim()) query = query.ilike("username", `%${q.trim().toLowerCase()}%`);
      const { data } = await query;
      return (data ?? []) as ProfileRow[];
    },
  });

  const apply = async () => {
    if (!confirm) return;
    const { data: u } = await supabase.auth.getUser();
    const payload = confirm.ban
      ? { is_banned: true, banned_at: new Date().toISOString(), banned_by: u.user?.id, ban_reason: reason || null }
      : { is_banned: false, banned_at: null, banned_by: null, ban_reason: null };
    const { error } = await supabase.from("profiles").update(payload).eq("id", confirm.p.id);
    if (error) { toast({ title: "Hata", description: error.message, variant: "destructive" }); return; }
    toast({ title: confirm.ban ? "Kullanıcı banlandı" : "Ban kaldırıldı" });
    setConfirm(null); setReason("");
    qc.invalidateQueries({ queryKey: ["mod-users"] });
    qc.invalidateQueries({ queryKey: ["mod-stats"] });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <Button variant={view === "banned" ? "default" : "outline"} size="sm" onClick={() => setView("banned")}>Banlılar</Button>
        <Button variant={view === "search" ? "default" : "outline"} size="sm" onClick={() => setView("search")}>Ara</Button>
        {view === "search" && (
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="kullanıcı adı…" className="max-w-xs h-9" />
        )}
      </div>
      {isLoading ? <div className="text-sm text-muted-foreground">Yükleniyor…</div> :
        !data?.length ? <Card className="p-8 text-center text-sm text-muted-foreground">Sonuç yok.</Card> :
          <div className="space-y-2">
            {data.map((p) => (
              <Card key={p.id} className={`p-4 ${p.is_banned ? "border-danger/40" : ""}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/score/${p.username}`} className="font-bold hover:text-primary">@{p.username}</Link>
                    {p.display_name && <span className="text-xs text-muted-foreground ml-2">{p.display_name}</span>}
                    {p.is_banned && <Badge variant="destructive" className="ml-2">BANLI</Badge>}
                    {p.ban_reason && <div className="text-xs text-muted-foreground mt-1">Sebep: {p.ban_reason}</div>}
                    {p.banned_at && <div className="text-[11px] text-muted-foreground font-mono">{fmt(p.banned_at)}</div>}
                  </div>
                  <div>
                    {p.is_banned ? (
                      <Button size="sm" variant="outline" onClick={() => setConfirm({ p, ban: false })}>
                        <RotateCcw className="h-3 w-3 mr-1" />Banı kaldır
                      </Button>
                    ) : (
                      <Button size="sm" variant="destructive" onClick={() => setConfirm({ p, ban: true })}>
                        <Ban className="h-3 w-3 mr-1" />Banla
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
      }

      <AlertDialog open={!!confirm} onOpenChange={(o) => { if (!o) { setConfirm(null); setReason(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.ban ? `@${confirm?.p.username} banlansın mı?` : `@${confirm?.p.username} için banı kaldır`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.ban
                ? "Banlı kullanıcılar yeni başlık veya yorum ekleyemez. İstediğin zaman geri alabilirsin."
                : "Bu kullanıcı tekrar içerik üretebilecek."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirm?.ban && (
            <Input placeholder="Sebep (opsiyonel)" value={reason} onChange={(e) => setReason(e.target.value)} />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={apply} className={confirm?.ban ? "bg-danger text-destructive-foreground hover:bg-danger/90" : ""}>
              {confirm?.ban ? "Banla" : "Banı kaldır"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/* ---------------- My Actions ---------------- */
const MyActionsTab = () => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["mod-my-actions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [entries, comments, media] = await Promise.all([
        supabase.from("entries")
          .select("id, target, category, description, deleted_at, created_at, user_id, deleted_by, profiles:profiles!inner(username)")
          .eq("deleted_by", user!.id).not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false }).limit(50),
        supabase.from("comments")
          .select("id, content, entry_id, deleted_at, created_at, user_id, deleted_by, profiles:profiles!inner(username)")
          .eq("deleted_by", user!.id).not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false }).limit(50),
        supabase.from("comment_media")
          .select("id, comment_id, status, updated_at, user_id, moderator_id, profiles:profiles!inner(username)")
          .eq("moderator_id", user!.id).neq("status", "pending")
          .order("updated_at", { ascending: false }).limit(50),
      ]);
      return {
        entries: (entries.data ?? []) as unknown as EntryRow[],
        comments: (comments.data ?? []) as unknown as CommentRow[],
        media: (media.data ?? []) as any[],
      };
    },
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Yükleniyor…</div>;
  const empty = !data?.entries.length && !data?.comments.length && !data?.media.length;
  if (empty) return <Card className="p-8 text-center text-sm text-muted-foreground">Henüz hiç moderasyon işlemin yok.</Card>;

  return (
    <div className="space-y-6">
      {!!data?.entries.length && (
        <section>
          <h3 className="font-bold mb-2">Sildiğin başlıklar ({data.entries.length})</h3>
          <div className="space-y-2">
            {data.entries.map((e) => (
              <Card key={e.id} className="p-3 text-sm">
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="font-mono">{e.category}</Badge>
                  <Link to={entryUrl(e)} className="font-bold hover:text-primary">{e.target}</Link>
                </div>
                <p className="text-muted-foreground line-clamp-2 mt-1">{e.description}</p>
                <div className="text-[11px] text-muted-foreground font-mono mt-1">@{e.profiles?.username} • silindi {fmt(e.deleted_at)}</div>
              </Card>
            ))}
          </div>
        </section>
      )}
      {!!data?.comments.length && (
        <section>
          <h3 className="font-bold mb-2">Sildiğin yorumlar ({data.comments.length})</h3>
          <div className="space-y-2">
            {data.comments.map((c) => (
              <Card key={c.id} className="p-3 text-sm">
                <p className="line-clamp-3">{c.content}</p>
                <div className="text-[11px] text-muted-foreground font-mono mt-1">@{c.profiles?.username} • silindi {fmt(c.deleted_at)}</div>
              </Card>
            ))}
          </div>
        </section>
      )}
      {!!data?.media.length && (
        <section>
          <h3 className="font-bold mb-2">Medya kararlarım ({data.media.length})</h3>
          <div className="space-y-2">
            {data.media.map((m) => (
              <Card key={m.id} className="p-3 text-sm flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs">@{m.profiles?.username}</span>
                  <Badge variant={m.status === "approved" ? "default" : "destructive"} className="ml-2">
                    {m.status === "approved" ? "onayladın" : "reddettin"}
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">{fmt(m.updated_at)}</span>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ModDashboard;
