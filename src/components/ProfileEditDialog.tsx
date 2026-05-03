import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: {
    user_id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    city?: string | null;
    occupation?: string | null;
    age?: number | null;
    bio?: string | null;
  };
}

const ProfileEditDialog = ({ open, onOpenChange, initial }: Props) => {
  const { t } = useTranslation();
  const { refreshProfile } = useAuth();
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState(initial.display_name ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [occupation, setOccupation] = useState(initial.occupation ?? "");
  const [age, setAge] = useState<string>(initial.age != null ? String(initial.age) : "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDisplayName(initial.display_name ?? "");
      setCity(initial.city ?? "");
      setOccupation(initial.occupation ?? "");
      setAge(initial.age != null ? String(initial.age) : "");
      setBio(initial.bio ?? "");
      setAvatarUrl(initial.avatar_url);
    }
  }, [open, initial]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t("profile.edit.avatarTooBig"), variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${initial.user_id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) {
      setUploading(false);
      toast({ title: t("entry.failed"), description: upErr.message, variant: "destructive" });
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(pub.publicUrl);
    setUploading(false);
  };

  const save = async () => {
    setSaving(true);
    const ageNum = age.trim() ? Number(age) : null;
    if (ageNum !== null && (Number.isNaN(ageNum) || ageNum < 13 || ageNum > 120)) {
      setSaving(false);
      toast({ title: t("profile.edit.ageInvalid"), variant: "destructive" });
      return;
    }
    const payload = {
      display_name: displayName.trim() || null,
      city: city.trim() || null,
      occupation: occupation.trim() || null,
      age: ageNum,
      bio: bio.trim() || null,
      avatar_url: avatarUrl,
    };
    const { error } = await supabase
      .from("profiles")
      .update(payload as any)
      .eq("user_id", initial.user_id);
    setSaving(false);
    if (error) {
      toast({ title: t("entry.failed"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("actions.updatedSuccess") });
    await refreshProfile();
    qc.invalidateQueries({ queryKey: ["userProfile"] });
    onOpenChange(false);
  };

  const initials = (displayName || initial.username).slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("profile.edit.title")}</DialogTitle>
          <DialogDescription>{t("profile.edit.desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {avatarUrl && <AvatarImage src={avatarUrl} />}
              <AvatarFallback className="bg-primary/10 text-primary font-mono">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Camera className="h-4 w-4 mr-1" />}
                {t("profile.edit.changeAvatar")}
              </Button>
              <p className="text-[11px] text-muted-foreground mt-1">{t("profile.edit.avatarHint")}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">{t("profile.edit.displayName")}</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={60}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">{t("profile.edit.city")}</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">{t("profile.edit.age")}</Label>
              <Input
                id="age"
                type="number"
                min={13}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="occupation">{t("profile.edit.occupation")}</Label>
            <Input
              id="occupation"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              maxLength={80}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">{t("profile.edit.bio")}</Label>
            <Textarea
              id="bio"
              rows={3}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("profile.edit.bioPlaceholder")}
            />
            <p className="text-[11px] text-muted-foreground text-right font-mono">{bio.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("actions.cancel")}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "..." : t("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditDialog;
