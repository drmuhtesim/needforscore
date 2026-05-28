import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import NoindexHead from "@/components/NoindexHead";

const VerifyEmail = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { refreshProfile } = useAuth();
  const [state, setState] = useState<"loading" | "ok" | "fail">("loading");

  useEffect(() => {
    const token = params.get("token") ?? "";
    if (!token) {
      setState("fail");
      return;
    }
    (async () => {
      const { data, error } = await supabase.rpc("verify_email_with_token", { _token: token });
      if (error || !data) {
        setState("fail");
      } else {
        setState("ok");
        await refreshProfile();
      }
    })();
  }, [params, refreshProfile]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center space-y-4">
        {state === "loading" && (
          <>
            <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
            <h1 className="text-xl font-bold">{t("verify.loadingTitle")}</h1>
          </>
        )}
        {state === "ok" && (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto text-safe" />
            <h1 className="text-xl font-bold">{t("verify.okTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("verify.okDesc")}</p>
            <Link to="/" className="inline-block mt-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold">
              {t("verify.continue")}
            </Link>
          </>
        )}
        {state === "fail" && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-danger" />
            <h1 className="text-xl font-bold">{t("verify.failTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("verify.failDesc")}</p>
            <Link to="/" className="inline-block mt-2 px-4 py-2 rounded-md border border-border text-sm font-semibold">
              {t("verify.backHome")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
