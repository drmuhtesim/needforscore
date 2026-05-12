import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import MobileBottomBar from "@/components/MobileBottomBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, ArrowLeft, Check, CheckCheck } from "lucide-react";
import { getOrCreateConversation } from "@/lib/messaging";
import { applyProfilePrivacy, PROFILE_PRIVACY_FIELDS } from "@/lib/profilePrivacy";

interface ConversationRow {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
}

interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

const formatTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const formatDayLabel = (iso: string, t: (k: string) => string) => {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return t("messages.today");
  if (sameDay(d, yest)) return t("messages.yesterday");
  return d.toLocaleDateString();
};

const Messages = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(params.get("c"));
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth?mode=signin");
  }, [loading, user, navigate]);

  useEffect(() => {
    const to = params.get("to");
    if (!to || !user) return;
    (async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", to)
        .maybeSingle();
      if (!p) {
        toast.error(t("profile.notFound") as string);
        return;
      }
      if (p.user_id === user.id) {
        toast.error(t("messages.cannotMessageSelf") as string);
        return;
      }
      try {
        const cid = await getOrCreateConversation(user.id, p.user_id);
        setActiveId(cid);
        setParams({ c: cid }, { replace: true });
        qc.invalidateQueries({ queryKey: ["conversations"] });
      } catch (e: any) {
        toast.error(e.message ?? "error");
      }
    })();
  }, [params, user, qc, setParams, t]);

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<{ conv: ConversationRow; other: Profile | null; lastMessage: string | null }[]> => {
      const { data: convs, error } = await supabase
        .from("conversations")
        .select("id, user1_id, user2_id, last_message_at")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      const list = convs ?? [];
      if (list.length === 0) return [];

      const otherIds = list.map((c) => (c.user1_id === user!.id ? c.user2_id : c.user1_id));
      const { data: profs } = await supabase
        .from("profiles")
        .select(PROFILE_PRIVACY_FIELDS)
        .in("user_id", otherIds);
      const map = new Map(
        (profs ?? []).map((p) => [p.user_id, applyProfilePrivacy(p as any, user!.id) as any]),
      );

      const { data: lastMsgs } = await supabase
        .from("messages")
        .select("conversation_id, content, created_at")
        .in("conversation_id", list.map((c) => c.id))
        .order("created_at", { ascending: false });
      const lastByConv = new Map<string, string>();
      (lastMsgs ?? []).forEach((m) => {
        if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m.content);
      });

      return list.map((c) => ({
        conv: c,
        other: map.get(c.user1_id === user!.id ? c.user2_id : c.user1_id) ?? null,
        lastMessage: lastByConv.get(c.id) ?? null,
      }));
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", activeId],
    enabled: !!activeId,
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, created_at, read_at")
        .eq("conversation_id", activeId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("messages-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          qc.invalidateQueries({ queryKey: ["conversations"] });
          if (msg.conversation_id === activeId) {
            qc.invalidateQueries({ queryKey: ["messages", activeId] });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, activeId, qc]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, activeId]);

  const activeConv = useMemo(
    () => conversations.find((c) => c.conv.id === activeId) ?? null,
    [conversations, activeId]
  );

  const send = async () => {
    if (!user || !activeId) return;
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: activeId,
      sender_id: user.id,
      content,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft("");
    qc.invalidateQueries({ queryKey: ["messages", activeId] });
    qc.invalidateQueries({ queryKey: ["conversations"] });
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">…</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex min-h-0 pb-14 lg:pb-0">
        {/* Konuşma listesi (WA chat list) */}
        <aside
          className={`w-full lg:w-80 lg:border-r border-border flex-col bg-card ${
            activeId ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="px-4 py-3 border-b border-border bg-primary text-primary-foreground">
            <h1 className="text-base font-semibold">{t("messages.title")}</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">
                {t("messages.empty")}
              </div>
            ) : (
              <ul>
                {conversations.map(({ conv, other, lastMessage }) => (
                  <li key={conv.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(conv.id);
                        setParams({ c: conv.id }, { replace: true });
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-border/60 flex items-center gap-3 hover:bg-secondary/60 transition-colors ${
                        activeId === conv.id ? "bg-secondary/60" : ""
                      }`}
                    >
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        {other?.avatar_url && <AvatarImage src={other.avatar_url} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-mono">
                          {(other?.username ?? "??").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold truncate">
                            {other?.display_name || other?.username || "..."}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex-shrink-0">
                            {formatTime(conv.last_message_at)}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {lastMessage ?? `@${other?.username ?? ""}`}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Aktif konuşma (WA chat) */}
        <section
          className={`flex-1 flex-col min-w-0 ${activeId ? "flex" : "hidden lg:flex"}`}
        >
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground bg-wa-pattern">
              {t("messages.selectConversation")}
            </div>
          ) : (
            <>
              {/* WA-style green header */}
              <div className="px-3 sm:px-4 py-2.5 bg-primary text-primary-foreground flex items-center gap-3 flex-shrink-0 shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(null);
                    setParams({}, { replace: true });
                  }}
                  className="lg:hidden h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-white/10"
                  aria-label="back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-white/20">
                  {activeConv?.other?.avatar_url && <AvatarImage src={activeConv.other.avatar_url} />}
                  <AvatarFallback className="bg-white/15 text-primary-foreground text-xs font-mono">
                    {(activeConv?.other?.username ?? "??").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => activeConv?.other?.username && navigate(`/score/${activeConv.other.username}`)}
                  className="min-w-0 flex-1 text-left hover:opacity-90"
                >
                  <div className="text-sm font-semibold truncate">
                    {activeConv?.other?.display_name || activeConv?.other?.username || "..."}
                  </div>
                  <div className="text-[11px] opacity-80 truncate">
                    @{activeConv?.other?.username ?? "..."}
                  </div>
                </button>
              </div>

              {/* Messages list with WA wallpaper */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 bg-wa-pattern">
                {messages.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-8">
                    {t("messages.noMessages")}
                  </div>
                )}
                {messages.map((m, idx) => {
                  const mine = m.sender_id === user.id;
                  const prev = messages[idx - 1];
                  const grouped = prev && prev.sender_id === m.sender_id;
                  const prevDay = prev ? new Date(prev.created_at).toDateString() : null;
                  const currDay = new Date(m.created_at).toDateString();
                  const showDay = prevDay !== currDay;
                  return (
                    <div key={m.id}>
                      {showDay && (
                        <div className="flex justify-center my-3">
                          <span className="text-[10px] uppercase tracking-wide bg-card/90 text-muted-foreground px-2.5 py-1 rounded-md shadow-sm">
                            {formatDayLabel(m.created_at, t as any)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${mine ? "justify-end" : "justify-start"} ${grouped ? "mt-0.5" : "mt-2"}`}>
                        <div
                          className={`relative max-w-[82%] sm:max-w-[68%] pl-3 pr-2 pt-1.5 pb-1 text-sm whitespace-pre-wrap break-words shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] ${
                            mine
                              ? "bg-[hsl(var(--wa-out))] text-foreground rounded-lg rounded-tr-sm"
                              : "bg-[hsl(var(--wa-in))] text-foreground rounded-lg rounded-tl-sm"
                          }`}
                        >
                          <span className="pr-12">{m.content}</span>
                          <span className="float-right ml-2 mt-1 inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/90 leading-none">
                            {formatTime(m.created_at)}
                            {mine && (
                              m.read_at ? (
                                <CheckCheck className="h-3 w-3 text-primary" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* WA-style composer */}
              <div className="bg-secondary/40 backdrop-blur-sm px-2 sm:px-3 py-2 flex-shrink-0 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
                <div className="flex items-end gap-2 max-w-3xl mx-auto w-full">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder={t("messages.placeholder") as string}
                    rows={1}
                    className="resize-none min-h-[42px] max-h-32 rounded-3xl px-4 py-2.5 text-sm flex-1 min-w-0 bg-card border border-border shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={sending || !draft.trim()}
                    aria-label={t("messages.send") as string}
                    className="h-11 w-11 rounded-full flex-shrink-0 bg-primary text-primary-foreground inline-flex items-center justify-center shadow-md hover:opacity-90 disabled:opacity-40 transition-opacity"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
      <MobileBottomBar />
    </div>
  );
};

export default Messages;
