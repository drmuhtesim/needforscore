import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ShieldAlert, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const ModLogin = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isModerator, loading: rolesLoading } = useUserRoles();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Already signed in: if mod → go to panel, otherwise sign them out (mod login only).
  useEffect(() => {
    if (loading || rolesLoading || !user) return;
    if (isModerator) navigate("/mod", { replace: true });
    else {
      supabase.auth.signOut().then(() => {
        toast({
          title: "Moderatör değilsin",
          description: "Bu giriş sadece moderatörler içindir. Oturumun kapatıldı.",
          variant: "destructive",
        });
      });
    }
  }, [loading, rolesLoading, user, isModerator, navigate]);

  if (loading) return null;
  if (user && isModerator) return <Navigate to="/mod" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      let email = identifier.trim();
      if (!email.includes("@")) {
        const { data: resolved, error: rpcErr } = await supabase.rpc("get_email_by_username", {
          _username: email.toLowerCase(),
        });
        if (rpcErr || !resolved) {
          toast({ title: "Bulunamadı", description: "Bu kullanıcı adıyla bir hesap yok.", variant: "destructive" });
          setBusy(false);
          return;
        }
        email = resolved as string;
      }

      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !signInData.user) {
        toast({ title: "Giriş başarısız", description: error?.message ?? "Bilgileri kontrol et.", variant: "destructive" });
        setBusy(false);
        return;
      }

      // Verify moderator role server-side using user_roles RLS (user can see own roles).
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", signInData.user.id);
      const isMod = (roles ?? []).some((r) => r.role === "admin" || r.role === "moderator");

      if (!isMod) {
        await supabase.auth.signOut();
        toast({
          title: "Yetki yok",
          description: "Bu hesap moderatör değil. Oturum kapatıldı.",
          variant: "destructive",
        });
        setBusy(false);
        return;
      }

      toast({ title: "Hoş geldin moderatör 🛡" });
      navigate("/mod", { replace: true });
    } catch (err: any) {
      toast({ title: "Hata", description: err?.message ?? "Bilinmeyen hata", variant: "destructive" });
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm p-6 border-suspicious/30">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-suspicious to-danger flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">Moderatör Girişi</h1>
            <p className="text-xs text-muted-foreground">Sadece yetkili hesaplar erişebilir.</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mod-id">E-posta veya kullanıcı adı</Label>
            <Input
              id="mod-id"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mod-pw">Şifre</Label>
            <Input
              id="mod-pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-gradient-to-r from-suspicious to-danger text-white font-bold">
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldAlert className="h-4 w-4 mr-2" />}
            Giriş yap
          </Button>
        </form>

        <p className="text-[11px] text-muted-foreground text-center mt-4 font-mono">
          Moderatör değilsen normal <a href="/auth?mode=signin" className="text-primary hover:underline">giriş sayfasını</a> kullan.
        </p>
      </Card>
    </div>
  );
};

export default ModLogin;
