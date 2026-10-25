import { useState } from "react";
import { Home, User as UserIcon, LogIn, Search, MessageSquare, Plus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import AddEntryDialog from "./LazyAddEntryDialog";
import UserSearchDialog from "./UserSearchDialog";

/**
 * Mobil cihazlarda sayfanın en altında sabit duran navigasyon barı.
 */
const MobileBottomBar = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { notifications } = useNotifications(20);
  const [searchOpen, setSearchOpen] = useState(false);

  const unreadMessages = notifications.filter(
    (n) => n.kind === "message" && !n.read_at
  ).length;
  const hasUnreadMessages = unreadMessages > 0;

  const requireAuth = (next: string) => {
    if (!user) {
      navigate("/auth?mode=signin");
      return false;
    }
    navigate(next);
    return true;
  };

  const isActive = (p: string) => pathname === p;
  const itemBase =
    "h-full w-full flex flex-col items-center justify-center gap-1 text-[11px] font-medium tracking-tight active:bg-secondary/60 transition-colors";

  return (
    <nav
      aria-label={t("header.mobileNav") as string}
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_28px_hsl(330_85%_60%/0.28)] bg-gradient-to-r from-[hsl(285_85%_60%/0.18)] via-[hsl(330_85%_60%/0.14)] to-[hsl(25_95%_60%/0.18)]"
    >
      <div aria-hidden className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[hsl(195_85%_60%)] via-[hsl(285_85%_65%)] via-[hsl(330_85%_60%)] to-[hsl(25_95%_60%)]" />
      <ul className="grid grid-cols-5 h-16 w-full px-2">
        <li>
          <Link
            to="/"
            className={`${itemBase} ${isActive("/") ? "text-primary" : "text-foreground/80"}`}
          >
            <Home className="h-6 w-6" strokeWidth={2.25} />
            {t("nav.home")}
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={() => requireAuth("/messages")}
            className={`${itemBase} relative ${
              pathname.startsWith("/messages")
                ? "text-primary"
                : hasUnreadMessages
                  ? "text-safe"
                  : "text-foreground/80"
            }`}
            aria-label={t("nav.messages") as string}
          >
            <span className="relative">
              <MessageSquare
                className={`h-6 w-6 ${hasUnreadMessages ? "text-safe" : ""}`}
                strokeWidth={2.25}
              />
              {user && hasUnreadMessages && (
                <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-safe text-background text-[10px] font-bold inline-flex items-center justify-center">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </span>
            {t("nav.messages")}
          </button>
        </li>
        <li className="flex items-center justify-center">
          {/* AddEntryDialog kendi auth yönlendirmesini yapar */}
          <AddEntryDialog
            trigger={
              <button
                type="button"
                aria-label={t("entry.add") as string}
                className="flex items-center justify-center h-12 w-12 rounded-full ring-2 ring-[hsl(330_85%_60%)] shadow-[0_0_24px_hsl(330_85%_60%/0.65)] active:scale-95 transition-transform bg-gradient-to-tr from-[hsl(285_85%_60%)] via-[hsl(330_85%_60%)] to-[hsl(25_95%_60%)]"
              >
                <Plus className="h-7 w-7 text-white" strokeWidth={2.75} />
              </button>
            }
          />
        </li>
        <li>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={`${itemBase} text-foreground/80`}
            aria-label={t("search.usersTitle") as string}
          >
            <Search className="h-6 w-6" strokeWidth={2.25} />
            {t("nav.search")}
          </button>
        </li>
        <li>
          {user && profile?.username ? (
            <Link
              to={`/score/${profile.username}`}
              className={`${itemBase} ${
                pathname.startsWith("/score/") ? "text-primary" : "text-foreground/80"
              }`}
            >
              <UserIcon className="h-6 w-6" strokeWidth={2.25} />
              {t("nav.profile")}
            </Link>
          ) : (
            <Link to="/auth?mode=signin" className={`${itemBase} text-foreground/80`}>
              <LogIn className="h-6 w-6" strokeWidth={2.25} />
              {t("header.signIn")}
            </Link>
          )}
        </li>
      </ul>
      <UserSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </nav>
  );
};

export default MobileBottomBar;
