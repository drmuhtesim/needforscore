import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"loading" | "ready" | "already" | "invalid" | "done" | "error">("loading");
  const [submitting, setSubmitting] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: supabaseAnonKey } }
        );
        const data = await res.json();
        if (data.valid) setState("ready");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("error");
      }
    })();
  }, [token, supabaseUrl, supabaseAnonKey]);

  const confirm = async () => {
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    setSubmitting(false);
    if (error || !data?.success) setState("error");
    else setState("done");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center space-y-4">
        {state === "loading" && (<><Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" /><h1 className="text-xl font-bold">Yükleniyor…</h1></>)}
        {state === "ready" && (
          <>
            <h1 className="text-xl font-bold">E-posta listesinden çık</h1>
            <p className="text-sm text-muted-foreground">Bu adrese gönderilen tüm app e-postalarını durdurmak istediğine emin misin?</p>
            <button onClick={confirm} disabled={submitting} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
              {submitting ? "İşleniyor…" : "Aboneliği iptal et"}
            </button>
          </>
        )}
        {state === "done" && (<><CheckCircle2 className="h-12 w-12 mx-auto text-safe" /><h1 className="text-xl font-bold">Aboneliğin iptal edildi</h1><p className="text-sm text-muted-foreground">Artık bu e-postaları almayacaksın.</p></>)}
        {state === "already" && (<><CheckCircle2 className="h-12 w-12 mx-auto text-safe" /><h1 className="text-xl font-bold">Zaten iptal edilmiş</h1></>)}
        {state === "invalid" && (<><XCircle className="h-12 w-12 mx-auto text-danger" /><h1 className="text-xl font-bold">Geçersiz bağlantı</h1></>)}
        {state === "error" && (<><XCircle className="h-12 w-12 mx-auto text-danger" /><h1 className="text-xl font-bold">Bir hata oluştu</h1></>)}
      </div>
    </div>
  );
};

export default Unsubscribe;
