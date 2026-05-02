import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Copy, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

/**
 * Banner shown to signed-in users whose email is not yet verified.
 * Until a real outbound email service is configured, the verification link
 * is shown directly to the user so they can copy/open it themselves.
 */
const EmailVerifyBanner = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!user || !profile) return null;
  if (profile.email_verified) return null;
  if (!profile.email_verification_token) return null;
  if (dismissed) return null;

  const link = `${window.location.origin}/verify-email?token=${profile.email_verification_token}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({ title: t("verify.copied") });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: t("verify.copyFailed"), variant: "destructive" });
    }
  };

  return (
    <div className="border-b border-warning/40 bg-warning/10 text-foreground">
      <div className="max-w-7xl mx-auto px-3 py-2 flex items-start sm:items-center gap-3 text-xs sm:text-sm">
        <Mail className="h-4 w-4 text-warning shrink-0 mt-0.5 sm:mt-0" />
        <div className="flex-1 min-w-0">
          <span className="font-semibold">{t("verify.bannerTitle")}</span>{" "}
          <span className="text-muted-foreground">{t("verify.bannerDesc")}</span>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <a
              href={link}
              className="text-primary underline font-mono truncate max-w-[60vw] inline-block align-middle"
            >
              {link}
            </a>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-background hover:bg-secondary text-[11px]"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {t(copied ? "verify.copied" : "verify.copyLink")}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="dismiss"
          className="text-muted-foreground hover:text-foreground p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default EmailVerifyBanner;
