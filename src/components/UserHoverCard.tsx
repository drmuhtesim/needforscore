import { useEffect, useState, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare } from "lucide-react";

interface Props {
  username: string;
  children: ReactNode;
}

interface MiniProfile {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  entry_count: number;
  signup_order: number | null;
  show_avatar: boolean;
  show_display_name: boolean;
}

const cache = new Map<string, MiniProfile | null>();

const UserHoverCard = ({ username, children }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MiniProfile | null | undefined>(cache.get(username));

  useEffect(() => {
    if (cache.has(username)) {
      setProfile(cache.get(username) ?? null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, signup_order, show_avatar, show_display_name")
        .eq("username", username)
        .maybeSingle();
      if (!data) {
        cache.set(username, null);
        if (!cancelled) setProfile(null);
        return;
      }
      const { count } = await supabase
        .from("entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", data.user_id)
        .is("deleted_at", null);
      const isOwner = !!user && user.id === data.user_id;
      const showAvatar = !!(data as any).show_avatar;
      const showDisplayName = !!(data as any).show_display_name;
      const mini: MiniProfile = {
        user_id: data.user_id,
        username: data.username,
        display_name: isOwner || showDisplayName ? data.display_name : null,
        avatar_url: isOwner || showAvatar ? data.avatar_url : null,
        entry_count: count ?? 0,
        signup_order: (data as any).signup_order ?? null,
        show_avatar: showAvatar,
        show_display_name: showDisplayName,
      };
      cache.set(username, mini);
      if (!cancelled) setProfile(mini);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <Link to={`/u/${username}`} className="hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
          {children}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent className="w-64" align="start">
        {profile === undefined ? (
          <div className="text-xs text-muted-foreground">...</div>
        ) : profile === null ? (
          <div className="text-xs text-muted-foreground">{t("profile.notFound")}</div>
        ) : (
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-mono">
                {profile.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-mono text-sm text-foreground truncate">@{profile.username}</p>
              </div>
              {profile.display_name && (
                <p className="text-xs text-muted-foreground truncate">{profile.display_name}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-mono text-foreground">{profile.entry_count}</span> {t("profile.entries")}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <Link
                  to={`/u/${profile.username}`}
                  className="text-xs text-primary hover:underline"
                >
                  {t("profile.viewProfile")} →
                </Link>
                {user && user.id !== profile.user_id && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/messages?to=${profile.username}`);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageSquare className="h-3 w-3" />
                    {t("messages.sendTo")}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};

export default UserHoverCard;
