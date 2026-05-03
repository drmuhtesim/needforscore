import { Bell, MessageSquare, MessageCircle, Reply, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const iconFor = (k: AppNotification["kind"]) => {
  switch (k) {
    case "message":
      return MessageSquare;
    case "comment_reply":
      return Reply;
    case "entry_comment":
      return MessageCircle;
    case "thread_comment":
      return Users;
  }
};

const NotificationsBell = () => {
  const { t } = useTranslation();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications(20);
  const navigate = useNavigate();

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("nav.notifications") as string}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] font-bold inline-flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-sm font-semibold">{t("notif.title")}</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                markAllRead();
              }}
              className="text-xs text-primary hover:underline"
            >
              {t("notif.markAllRead")}
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">
              {t("notif.empty")}
            </div>
          ) : (
            <ul>
              {notifications.map((n) => {
                const Icon = iconFor(n.kind);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(n)}
                      className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-secondary/60 border-b border-border/60 last:border-b-0 transition-colors ${
                        !n.read_at ? "bg-primary/5" : ""
                      }`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        {n.actor?.avatar_url && <AvatarImage src={n.actor.avatar_url} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-mono">
                          {(n.actor?.username ?? "??").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm leading-snug">{labelFor(n)}</div>
                        {n.entry?.target && (
                          <div className="text-xs text-muted-foreground truncate font-mono">
                            @{n.entry.target}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(n.created_at).toLocaleString()}
                        </div>
                      </div>
                      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-1" />
                      {!n.read_at && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsBell;
