import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Instagram, BadgeCheck, Copy, Check, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Platform = "instagram" | "x" | "tiktok";

const platformMeta: Record<Platform, { label: string; profileUrl: (h: string) => string; color: string }> = {
  instagram: {
    label: "Instagram",
    profileUrl: (h) => `https://www.instagram.com/${h}/`,
    color: "text-[hsl(330_85%_60%)]",
  },
  x: {
    label: "X",
    profileUrl: (h) => `https://x.com/${h}`,
    color: "text-foreground",
  },
  tiktok: {
    label: "TikTok",
    profileUrl: (h) => `https://www.tiktok.com/@${h}`,
    color: "text-foreground",
  },
};

const PlatformGlyph = ({ platform, className }: { platform: Platform; className?: string }) => {
  if (platform === "instagram") return <Instagram className={className} />;
  if (platform === "x")
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.69a8.16 8.16 0 0 0 4.77 1.52V6.78a4.85 4.85 0 0 1-1.84-.09Z" />
    </svg>
  );
};

const LinkedAccountsPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Platform>("instagram");

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["linkedAccounts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("linked_accounts" as any)
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as Array<{
        id: string;
        platform: Platform;
        handle: string;
        handle_normalized: string;
        verification_code: string;
        verified: boolean;
        verified_at: string | null;
      }>;
    },
  });

  const current = accounts.find((a) => a.platform === tab);

  return (
    <div className="border border-border rounded-lg bg-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <BadgeCheck className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{t("profile.linkedAccounts")}</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{t("profile.linkDescription")}</p>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Platform)}>
        <TabsList className="grid grid-cols-3 w-full">
          {(Object.keys(platformMeta) as Platform[]).map((p) => {
            const acc = accounts.find((a) => a.platform === p);
            return (
              <TabsTrigger key={p} value={p} className="gap-1.5">
                <PlatformGlyph platform={p} className={`h-3.5 w-3.5 ${platformMeta[p].color}`} />
                <span className="text-xs">{platformMeta[p].label}</span>
                {acc?.verified && <BadgeCheck className="h-3 w-3 text-primary" />}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(platformMeta) as Platform[]).map((p) => (
          <TabsContent key={p} value={p} className="mt-3">
            <PlatformPanel
              platform={p}
              account={current && current.platform === p ? current : null}
              loading={isLoading}
              onChanged={() => qc.invalidateQueries({ queryKey: ["linkedAccounts", user?.id] })}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

const PlatformPanel = ({
  platform,
  account,
  loading,
  onChanged,
}: {
  platform: Platform;
  account: {
    id: string;
    platform: Platform;
    handle: string;
    handle_normalized: string;
    verification_code: string;
    verified: boolean;
  } | null;
  loading: boolean;
  onChanged: () => void;
}) => {
  const { t } = useTranslation();
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState<"start" | "verify" | "remove" | null>(null);
  const [copied, setCopied] = useState(false);

  if (loading) return <p className="text-xs text-muted-foreground py-2">…</p>;

  const meta = platformMeta[platform];

  if (account?.verified) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <BadgeCheck className="h-4 w-4 text-primary" />
          <a
            href={meta.profileUrl(account.handle_normalized)}
            target="_blank"
            rel="noreferrer"
            className="font-mono hover:underline inline-flex items-center gap-1"
          >
            @{account.handle_normalized}
            <ExternalLink className="h-3 w-3" />
          </a>
          <span className="text-xs text-primary">{t("profile.verified")}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={busy === "remove"}
          onClick={async () => {
            if (!confirm(t("profile.removeConfirm"))) return;
            setBusy("remove");
            const { error } = await supabase.from("linked_accounts" as any).delete().eq("id", account.id);
            setBusy(null);
            if (error) toast.error(error.message);
            else {
              toast.success("OK");
              onChanged();
            }
          }}
          className="gap-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t("profile.remove")}
        </Button>
      </div>
    );
  }

  if (account && !account.verified) {
    const code = account.verification_code;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <PlatformGlyph platform={platform} className={`h-4 w-4 ${meta.color}`} />
          <a
            href={meta.profileUrl(account.handle_normalized)}
            target="_blank"
            rel="noreferrer"
            className="font-mono hover:underline inline-flex items-center gap-1"
          >
            @{account.handle_normalized}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <p className="text-xs text-muted-foreground">{t("profile.instructions", { platform: meta.label })}</p>

        <div className="rounded-md border border-border bg-muted/40 p-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("profile.codeLabel")}</div>
            <div className="font-mono text-base font-semibold tracking-wider truncate">{code}</div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="gap-1 shrink-0"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t("profile.copied") : t("profile.copyCode")}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={busy === "verify"}
            onClick={async () => {
              setBusy("verify");
              const { data, error } = await supabase.functions.invoke("verify-link-account", {
                body: { platform },
              });
              setBusy(null);
              if (error) {
                toast.error(error.message ?? t("profile.verifyFailed"));
                return;
              }
              if ((data as any)?.verified) {
                toast.success(t("profile.verifySuccess"));
                onChanged();
              } else {
                toast.error((data as any)?.error ?? t("profile.verifyFailed"));
              }
            }}
            className="gap-1"
          >
            {busy === "verify" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
            {busy === "verify" ? t("profile.verifying") : t("profile.verifyNow")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy === "remove"}
            onClick={async () => {
              setBusy("remove");
              const { error } = await supabase.from("linked_accounts" as any).delete().eq("id", account.id);
              setBusy(null);
              if (error) toast.error(error.message);
              else onChanged();
            }}
          >
            {t("profile.remove")}
          </Button>
        </div>
      </div>
    );
  }

  // No account yet — start flow
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const cleaned = handle.replace(/^@+/, "").trim();
        if (cleaned.length < 1) return;
        setBusy("start");
        const { data, error } = await supabase.functions.invoke("start-link-account", {
          body: { platform, handle: cleaned },
        });
        setBusy(null);
        if (error) {
          toast.error(error.message);
          return;
        }
        if ((data as any)?.code) {
          setHandle("");
          onChanged();
        } else if ((data as any)?.error) {
          toast.error((data as any).error);
        }
      }}
      className="space-y-3"
    >
      <div>
        <Label htmlFor={`handle-${platform}`} className="text-xs">
          {meta.label} {t("profile.handle")}
        </Label>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-muted-foreground">@</span>
          <Input
            id={`handle-${platform}`}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={t("profile.handlePlaceholder")}
            maxLength={60}
            autoComplete="off"
          />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={busy === "start" || handle.trim().length === 0} className="gap-1">
        {busy === "start" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {t("profile.generateCode")}
      </Button>
    </form>
  );
};

export default LinkedAccountsPanel;
