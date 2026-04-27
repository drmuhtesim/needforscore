import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User as UserIcon } from "lucide-react";
import scoreLogo from "@/assets/score-logo.jpeg";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;

const UsernameOnboarding = () => {
  const { t } = useTranslation();
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Auth gate + skip if already chosen
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth?mode=signin", { replace: true });
      return;
    }
    if (profile?.username_chosen) {
      navigate("/", { replace: true });
    }
  }, [loading, user, profile, navigate]);

  // Live availability check
  useEffect(() => {
    if (!username || !USERNAME_RE.test(username)) {
      setAvailable(null);
      return;
    }
    setChecking(true);
    const handler = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();
      // Available if not taken OR if it's our own current auto-generated username
      setAvailable(!data || data.user_id === user?.id);
      setChecking(false);
    }, 350);
    return () => clearTimeout(handler);
  }, [username, user?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !USERNAME_RE.test(username) || available === false) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username, username_chosen: true })
      .eq("user_id", user.id);
    setSubmitting(false);
    if (error) {
      toast({
        title: t("auth.usernameTakenTitle"),
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    await refreshProfile();
    toast({ title: t("auth.usernameSaved") });
    navigate("/", { replace: true });
  };

  // Pre-fill with current auto-username so users can keep it if they like
  useEffect(() => {
    if (profile?.username && !username) setUsername(profile.username);
  }, [profile?.username]);

  if (loading || !user || profile?.username_chosen) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14 max-w-5xl mx-auto w-full">
          <span className="text-sm text-muted-foreground">{t("onboarding.welcome")}</span>
          <Link to="/" className="flex items-center gap-2" aria-label="Score">
            <img src={scoreLogo} alt="Score logo" className="h-7 w-7 rounded-lg object-cover shadow-sm" />
            <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-[hsl(195_85%_60%)] via-[hsl(285_85%_65%)] via-[hsl(330_85%_60%)] to-[hsl(25_95%_60%)] bg-clip-text text-transparent">
              Score
            </span>
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold">{t("onboarding.chooseUsernameTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("onboarding.chooseUsernameDesc")}</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                {t("auth.username")}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  pattern="[a-z0-9_.]{3,30}"
                  className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="user_name"
                  maxLength={30}
                  autoFocus
                />
              </div>
              <div className="text-xs min-h-[18px]">
                {username && !USERNAME_RE.test(username) && (
                  <span className="text-danger">{t("auth.usernameHint")}</span>
                )}
                {username && USERNAME_RE.test(username) && checking && (
                  <span className="text-muted-foreground">{t("onboarding.checking")}</span>
                )}
                {username && USERNAME_RE.test(username) && !checking && available === true && (
                  <span className="text-safe">✓ {t("onboarding.available")}</span>
                )}
                {username && USERNAME_RE.test(username) && !checking && available === false && (
                  <span className="text-danger">✗ {t("onboarding.taken")}</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !USERNAME_RE.test(username) || available === false || checking}
              className="w-full py-2.5 rounded-md text-sm font-semibold text-white border-0 hover:opacity-90 disabled:opacity-50 bg-gradient-to-r from-[hsl(285_85%_60%)] via-[hsl(330_85%_60%)] to-[hsl(25_95%_60%)]"
            >
              {submitting ? t("auth.submitting") : t("onboarding.continue")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UsernameOnboarding;
