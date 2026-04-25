import { Home, Plus, User as UserIcon, LogIn, Bell, MessageSquare } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import AddEntryDialog from "./AddEntryDialog";
import { toast } from "sonner";

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
                className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-md -mt-3 active:scale-95 transition-transform"
              >
                <Plus className="h-5 w-5" />
              </button>
            }
          />
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              if (!user) {
                navigate("/auth?mode=signin");
                return;
              }
              toast.info(t("nav.notifications") as string, {
                description: t("messages.empty") as string,
              });
            }}
            className={`${itemBase} text-muted-foreground`}
            aria-label={t("nav.notifications") as string}
          >
            <Bell className="h-5 w-5" />
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
