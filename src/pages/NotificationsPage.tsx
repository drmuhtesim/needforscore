import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import MobileBottomBar from "@/components/MobileBottomBar";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NotificationsPage = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications(50);

  useEffect(() => {
    if (!loading && !user) navigate("/auth?mode=signin");
  }, [loading, user, navigate]);

  const handleClick = async (n: AppNotification) => {
    if (!n.read_at) await markRead(n.id);
    if (n.kind === "message" && n.conversation_id) {
      navigate(`/messages?c=${n.conversation_id}`);
    } else if (n.entry_id) {
      navigate(`/e/${n.entry_id}${n.comment_id ? `#c-${n.comment_id}` : ""}`);
    }
  };

  const labelFor = (n: AppNotification) => {
    const who = n.actor?.display_name || n.actor?.username || "Birisi";
    switch (n.kind) {
      case "message":
        return `${who} ${t("notif.sentMessage")}`;
      case "comment_reply":
        return `${who} ${t("notif.repliedToYou")}`;
      case "entry_comment":
        return `${who} ${t("notif.commentedOnYourEntry")}`;
      case "thread_comment":
        return `${who} ${t("notif.commentedOnThread")}`;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-3 sm:px-4 py-4 pb-20 lg:pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">{t("notif.title")}</h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              {t("notif.markAllRead")}
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-12">{t("notif.empty")}</div>
        ) : (
          <ul className="border border-border rounded-lg overflow-hidden">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-3 py-3 flex items-start gap-3 hover:bg-secondary/60 border-b border-border/60 last:border-b-0 transition-colors ${
                    !n.read_at ? "bg-primary/5" : ""
                  }`}
                >
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    {n.actor?.avatar_url && <AvatarImage src={n.actor.avatar_url} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-mono">
                      {(n.actor?.username ?? "??").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">{labelFor(n)}</div>
                    {n.entry?.target && (
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        @{n.entry.target}
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                  {!n.read_at && <span className="h-2 w-2 rounded-full bg-primary mt-2" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
      <MobileBottomBar />
    </div>
  );
};

export default NotificationsPage;
