import { Home, Plus, User as UserIcon, LogIn, Bell, MessageSquare } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Mobil cihazlarda sayfanın en altında sabit duran navigasyon barı.
 * Masaüstünde gizlenir (lg:hidden).
 *
 * Mesajlar/bildirimler için henüz arka uç akışı yok; ikonlar yer tutucu olarak
 * gösteriliyor ve giriş yapmamış kullanıcıyı /auth'a yönlendiriyor.
 */
const MobileBottomBar = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const requireAuth = (next: string) => {
    if (!user) {
      navigate("/auth?mode=signin");
      return;
    }
    navigate(next);
  };

  const isActive = (p: string) => pathname === p;

  return (
    <nav
      aria-label={t("header.mobileNav") as string}
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5 h-14">
        <li>
          <Link
            to="/"
            className={`h-full w-full flex flex-col items-center justify-center gap-0.5 text-[10px] ${
              isActive("/") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Home className="h-5 w-5" />
            {t("nav.home")}
          </Link>
        </li>
        <li>
          <button
            onClick={() => requireAuth("/")}
            className="h-full w-full flex flex-col items-center justify-center gap-0.5 text-[10px] text-muted-foreground"
            aria-label={t("nav.messages") as string}
          >
            <MessageSquare className="h-5 w-5" />
            {t("nav.messages")}
          </button>
        </li>
        <li>
          <button
            onClick={() => requireAuth("/")}
            className="h-full w-full flex items-center justify-center"
            aria-label={t("entry.add") as string}
          >
            <span className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-md -mt-3">
              <Plus className="h-5 w-5" />
            </span>
          </button>
        </li>
        <li>
          <button
            onClick={() => requireAuth("/")}
            className="h-full w-full flex flex-col items-center justify-center gap-0.5 text-[10px] text-muted-foreground"
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
              className={`h-full w-full flex flex-col items-center justify-center gap-0.5 text-[10px] ${
                pathname.startsWith("/u/") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <UserIcon className="h-5 w-5" />
              {t("nav.profile")}
            </Link>
          ) : (
            <Link
              to="/auth?mode=signin"
              className="h-full w-full flex flex-col items-center justify-center gap-0.5 text-[10px] text-muted-foreground"
            >
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
