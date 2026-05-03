import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface Hit {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  show_avatar: boolean;
  show_display_name: boolean;
}

const UserSearchDialog = ({ open, onOpenChange }: Props) => {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQ("");
      setResults([]);
      return;
    }
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, show_avatar, show_display_name")
        .ilike("username", `%${term.toLowerCase()}%`)
        .limit(20);
      if (cancelled) return;
      setResults((data ?? []) as any);
      setLoading(false);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("search.usersTitle")}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search.usersPlaceholder") as string}
            className="pl-9 font-mono"
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto -mx-2">
          {loading && (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {!loading && q.trim().length >= 2 && results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t("search.noResults")}
            </p>
          )}
          <ul className="space-y-1">
            {results.map((u) => {
              const showAvatar = u.show_avatar && u.avatar_url;
              const showName = u.show_display_name && u.display_name;
              return (
                <li key={u.user_id}>
                  <Link
                    to={`/u/${u.username}`}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-secondary/60 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      {showAvatar && <AvatarImage src={u.avatar_url!} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-mono">
                        {u.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm truncate">@{u.username}</p>
                      {showName && (
                        <p className="text-xs text-muted-foreground truncate">{u.display_name}</p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserSearchDialog;
