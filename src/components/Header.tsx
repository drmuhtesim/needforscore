import { Menu, X, LogOut, User as UserIcon, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import AddEntryDialog from "./AddEntryDialog";
import { useAuth } from "@/contexts/AuthContext";
import scoreLogo from "@/assets/score-logo.jpeg";
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
      <EmailVerifyBanner />
      <div className="flex items-center justify-between px-4 lg:px-6 h-14">
        <Link to="/" className="flex items-center gap-2" aria-label="Score — needforscore.com">
          <img src={scoreLogo} alt="Score logo" className="h-8 w-8 rounded-lg object-cover shadow-sm" />
          <span className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-[hsl(195_85%_60%)] via-[hsl(285_85%_65%)] via-[hsl(330_85%_60%)] to-[hsl(25_95%_60%)] bg-clip-text text-transparent">
            Score
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Desktop: Score it / Add experience CTA — bigger, eye-catching */}
          <div className="hidden md:inline-flex">
            <AddEntryDialog />
          </div>
          {/* Mobile: prominent CTA. If logged out → Sign up; if logged in → Score it (Add) */}
          {!user ? (
            <Link
              to="/auth?mode=signup"
              className="md:hidden inline-flex items-center px-4 py-2 text-sm font-bold rounded-md text-white bg-gradient-to-r from-[hsl(285_85%_60%)] via-[hsl(330_85%_60%)] to-[hsl(25_95%_60%)] shadow-md hover:opacity-90"
            >
              {t("header.signUp")}
            </Link>
          ) : (
            <div className="md:hidden inline-flex">
              <AddEntryDialog />
            </div>
          )}
          {user && (
            <Link
              to="/messages"
              aria-label={t("messages.title") as string}
              className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
            </Link>
          )}
          <LanguageSwitcher />
          <ThemeToggle />

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
                {profile?.username && (
                  <DropdownMenuItem onClick={() => navigate(`/u/${profile.username}`)}>
                    <UserIcon className="h-4 w-4 mr-2" />
                    {t("header.myProfile")}
                  </DropdownMenuItem>
                )}
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
                className="hidden md:inline-flex items-center px-5 py-2.5 text-base font-bold rounded-md text-white bg-gradient-to-r from-[hsl(285_85%_60%)] via-[hsl(330_85%_60%)] to-[hsl(25_95%_60%)] shadow-md hover:opacity-90 transition-opacity"
              >
                {t("header.signUp")}
              </Link>
              <Link
                to="/auth?mode=signin"
                className="hidden md:inline-flex px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors"
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
          {user ? (
            <>
              <div className="text-xs text-muted-foreground font-mono px-1">@{profile?.username}</div>
              {profile?.username && (
                <Link to={`/u/${profile.username}`} className="block text-sm text-foreground hover:text-primary">
                  {t("header.myProfile")}
                </Link>
              )}
              <button onClick={handleSignOut} className="w-full px-4 py-2 border border-border text-danger text-sm font-semibold rounded-md">
                {t("header.signOut")}
              </button>
            </>
          ) : (
            <>
              <Link to="/auth?mode=signup" className="block w-full text-center px-4 py-3 text-base font-bold rounded-md text-white bg-gradient-to-r from-[hsl(285_85%_60%)] via-[hsl(330_85%_60%)] to-[hsl(25_95%_60%)] shadow-md">
                {t("header.signUp")}
              </Link>
              <Link to="/auth?mode=signin" className="block w-full text-center px-4 py-2 text-sm text-muted-foreground">
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
