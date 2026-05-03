import { Home, User as UserIcon, LogIn, Bell, MessageSquare } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import AddEntryDialog from "./AddEntryDialog";
import scoreLogo from "@/assets/score-logo.jpeg";

/**
 * Mobil cihazlarda sayfanın en altında sabit duran navigasyon barı.
 * Masaüstünde gizlenir (lg:hidden). Tüm tuşlar tıklanabilir; arka uç
 * gerektiren akışlar (mesajlar/bildirimler) henüz yok ise toast gösterir.
 */
const MobileBottomBar = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { unreadCount } = useNotifications(20);

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
    "h-full w-full flex flex-col items-center justify-center gap-0.5 text-[10px] active:bg-secondary/60 transition-colors";

  return (
    <nav
      aria-label={t("header.mobileNav") as string}
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5 h-14">
        <li>
          <Link
            to="/"
            className={`${itemBase} ${isActive("/") ? "text-primary" : "text-muted-foreground"}`}
          >
            <Home className="h-5 w-5" />
            {t("nav.home")}
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={() => requireAuth("/messages")}
            className={`${itemBase} ${pathname.startsWith("/messages") ? "text-primary" : "text-muted-foreground"}`}
            aria-label={t("nav.messages") as string}
          >
            <MessageSquare className="h-5 w-5" />
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
                className="flex items-center justify-center h-12 w-12 rounded-full overflow-hidden ring-2 ring-primary shadow-[0_0_18px_hsl(var(--primary)/0.55)] -mt-3 active:scale-95 transition-transform bg-card"
              >
                <img src={scoreLogo} alt="" className="h-full w-full object-cover" />
              </button>
            }
          />
        </li>
        <li>
          <button
            type="button"
            onClick={() => requireAuth("/notifications")}
            className={`${itemBase} relative ${
              pathname.startsWith("/notifications") ? "text-primary" : "text-muted-foreground"
            }`}
            aria-label={t("nav.notifications") as string}
          >
            <span className="relative">
              <Bell className="h-5 w-5" />
              {user && unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-1 rounded-full bg-danger text-white text-[9px] font-bold inline-flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
            {t("nav.notifications")}
          </button>
        </li>
        <li>
          {user && profile?.username ? (
            <Link
              to={`/u/${profile.username}`}
              className={`${itemBase} ${
                pathname.startsWith("/u/") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <UserIcon className="h-5 w-5" />
              {t("nav.profile")}
            </Link>
          ) : (
            <Link to="/auth?mode=signin" className={`${itemBase} text-muted-foreground`}>
              <LogIn className="h-5 w-5" />
              {t("header.signIn")}
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default MobileBottomBar;
