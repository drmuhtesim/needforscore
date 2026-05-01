import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Mail, Lock, User as UserIcon, ArrowLeft } from "lucide-react";
import scoreLogo from "@/assets/score-logo.jpeg";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const signUpSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_.]+$/, "lowercase letters, numbers, _ or . only"),
});

const signInSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(72),
});

const Auth = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, loading } = useAuth();

  const initialMode = params.get("mode") === "signup" ? "signup" : "signin";
  const nextParam = params.get("next");
  // Only allow same-origin relative paths to avoid open-redirect issues.
  const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate(safeNext, { replace: true });
  }, [user, loading, navigate, safeNext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const parsed = signUpSchema.safeParse({ email, password, username });
        if (!parsed.success) {
          toast({ title: t("auth.invalidInput"), description: parsed.error.issues[0].message, variant: "destructive" });
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}${safeNext}`,
            data: { username: parsed.data.username },
          },
        });
        if (error) {
          toast({ title: t("auth.signUpFailed"), description: error.message, variant: "destructive" });
          return;
        }
        toast({ title: t("auth.checkEmail"), description: t("auth.checkEmailDesc") });
      } else {
        const parsed = signInSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast({ title: t("auth.invalidInput"), description: parsed.error.issues[0].message, variant: "destructive" });
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) {
          toast({ title: t("auth.signInFailed"), description: error.message, variant: "destructive" });
          return;
        }
        toast({ title: t("auth.welcome") });
        navigate(safeNext, { replace: true });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}${safeNext}`,
      });
      if (result.error) {
        toast({ title: t("auth.signInFailed"), description: String(result.error.message ?? result.error), variant: "destructive" });
        setSubmitting(false);
        return;
      }
      if (result.redirected) return; // browser will navigate
      navigate(safeNext, { replace: true });
    } catch (err) {
      toast({ title: t("auth.signInFailed"), description: String(err), variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14 max-w-5xl mx-auto w-full">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4" />
            <span>{t("auth.backHome")}</span>
          </Link>
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
            <h1 className="text-2xl font-bold">
              {mode === "signin" ? t("auth.signInTitle") : t("auth.signUpTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signin" ? t("auth.signInSubtitle") : t("auth.signUpSubtitle")}
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 border border-border rounded-md py-2.5 text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            {t("auth.continueWithGoogle")}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">{t("auth.or")}</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t("auth.email")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  autoComplete="email"
                  maxLength={255}
                />
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">{t("auth.username")}</label>
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
                    autoComplete="username"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t("auth.usernameHint")}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t("auth.password")}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={mode === "signup" ? 8 : 1}
                  maxLength={72}
                  className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </div>
              {mode === "signup" && <p className="text-xs text-muted-foreground">{t("auth.passwordHint")}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? t("auth.submitting") : mode === "signin" ? t("header.signIn") : t("header.signUp")}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary font-semibold hover:underline"
            >
              {mode === "signin" ? t("header.signUp") : t("header.signIn")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
