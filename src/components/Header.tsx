import { Shield, Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 lg:px-6 h-14">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">
            Safe<span className="text-primary">Net</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden md:inline-flex items-center gap-2 px-3 py-2 border border-border text-foreground text-sm font-semibold rounded-md hover:bg-secondary transition-colors">
                  <UserIcon className="h-4 w-4" />
                  <span className="font-mono">@{profile?.username ?? "..."}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px]">
                <DropdownMenuItem disabled className="opacity-100 text-xs text-muted-foreground">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-danger">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("header.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                to="/auth?mode=signup"
                className="hidden md:inline-flex px-4 py-2 border border-border text-foreground text-sm font-semibold rounded-md hover:bg-secondary transition-colors"
              >
                {t("header.signUp")}
              </Link>
              <Link
                to="/auth?mode=signin"
                className="hidden md:inline-flex px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors"
              >
                {t("header.signIn")}
              </Link>
            </>
          )}

          <button className="md:hidden text-muted-foreground" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenu && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-3">
          <a href="#" className="block text-sm text-muted-foreground hover:text-foreground">{t("header.discover")}</a>
          <a href="#" className="block text-sm text-muted-foreground hover:text-foreground">{t("header.addReport")}</a>
          <a href="#" className="block text-sm text-muted-foreground hover:text-foreground">{t("header.api")}</a>
          <a href="#" className="block text-sm text-muted-foreground hover:text-foreground">{t("header.about")}</a>
          {user ? (
            <>
              <div className="text-xs text-muted-foreground font-mono px-1">@{profile?.username}</div>
              <button onClick={handleSignOut} className="w-full px-4 py-2 border border-border text-danger text-sm font-semibold rounded-md">
                {t("header.signOut")}
              </button>
            </>
          ) : (
            <>
              <Link to="/auth?mode=signup" className="block w-full text-center px-4 py-2 border border-border text-foreground text-sm font-semibold rounded-md">
                {t("header.signUp")}
              </Link>
              <Link to="/auth?mode=signin" className="block w-full text-center px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md">
                {t("header.signIn")}
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
