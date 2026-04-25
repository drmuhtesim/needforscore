import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import MobileBottomBar from "@/components/MobileBottomBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, ArrowLeft } from "lucide-react";
import { getOrCreateConversation } from "@/lib/messaging";

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

  // Auth gate
  useEffect(() => {
    if (!loading && !user) navigate("/auth?mode=signin");
  }, [loading, user, navigate]);

  // ?to=username -> sohbeti aç/oluştur
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

  // Konuşma listesi
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
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", otherIds);
      const map = new Map((profs ?? []).map((p) => [p.user_id, p]));

      // Son mesajları çek
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

  // Aktif konuşma mesajları
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

  // Realtime: yeni mesaj
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

  // Otomatik en alta scroll
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
    <div className="min-h-screen bg-background flex flex-col pb-14 lg:pb-0">
      <Header />
      <main className="flex-1 flex">
        {/* Konuşma listesi */}
        <aside
          className={`w-full lg:w-80 border-r border-border flex flex-col ${
            activeId ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="px-4 py-3 border-b border-border">
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
                      className={`w-full text-left px-4 py-3 border-b border-border flex items-center gap-3 hover:bg-secondary/60 transition-colors ${
                        activeId === conv.id ? "bg-secondary/60" : ""
                      }`}
                    >
                      <Avatar className="h-9 w-9">
                        {other?.avatar_url && <AvatarImage src={other.avatar_url} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-mono">
                          {(other?.username ?? "??").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-mono truncate">@{other?.username ?? "..."}</div>
                        {lastMessage && (
                          <div className="text-xs text-muted-foreground truncate">{lastMessage}</div>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Aktif konuşma */}
        <section
          className={`flex-1 flex flex-col min-w-0 ${activeId ? "flex" : "hidden lg:flex"}`}
        >
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              {t("messages.selectConversation")}
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(null);
                    setParams({}, { replace: true });
                  }}
                  className="lg:hidden text-muted-foreground"
                  aria-label="back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-mono">
                  @{activeConv?.other?.username ?? "..."}
                </span>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {messages.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-8">
                    {t("messages.noMessages")}
                  </div>
                )}
                {messages.map((m) => {
                  const mine = m.sender_id === user.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                          mine
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-border p-3 flex items-end gap-2">
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
                  className="resize-none min-h-[40px] max-h-32"
                />
                <Button onClick={send} disabled={sending || !draft.trim()} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
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
