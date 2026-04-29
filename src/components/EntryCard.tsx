import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageSquare, BadgeCheck, Star, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import PlatformIcon from "./PlatformIcon";
import VoteButtons from "./VoteButtons";
import { formatTargetDisplay } from "@/lib/platforms";
import type { EntryRow as EntryT } from "@/hooks/useEntries";

interface Props {
  entry: EntryT;
  index: number;
}

type RiskTone = "safe" | "suspicious" | "danger" | "neutral";

const riskFromRating = (r: number | null | undefined): RiskTone => {
  if (r == null) return "neutral";
  if (r >= 7) return "safe";
  if (r >= 4) return "suspicious";
  return "danger";
};

const riskClasses: Record<RiskTone, { bar: string; chip: string; text: string; icon: JSX.Element; label: string }> = {
  safe: {
    bar: "bg-safe",
    chip: "bg-safe/10 text-safe border-safe/30",
    text: "text-safe",
    icon: <ShieldCheck className="h-3 w-3" />,
    label: "GÜVENLİ",
  },
  suspicious: {
    bar: "bg-suspicious",
    chip: "bg-suspicious/10 text-suspicious border-suspicious/30",
    text: "text-suspicious",
    icon: <ShieldQuestion className="h-3 w-3" />,
    label: "ŞÜPHELİ",
  },
  danger: {
    bar: "bg-destructive",
    chip: "bg-destructive/10 text-destructive border-destructive/30",
    text: "text-destructive",
    icon: <ShieldAlert className="h-3 w-3" />,
    label: "RİSKLİ",
  },
  neutral: {
    bar: "bg-muted",
    chip: "bg-muted text-muted-foreground border-border",
    text: "text-muted-foreground",
    icon: <ShieldQuestion className="h-3 w-3" />,
    label: "—",
  },
};

const EntryCard = ({ entry, index }: Props) => {
  const { t } = useTranslation();
  const tone = riskFromRating(entry.avg_rating);
  const r = riskClasses[tone];
  const ratingDisplay = entry.avg_rating != null ? entry.avg_rating.toFixed(1) : "—";

  return (
    <div
      className="group relative flex overflow-hidden rounded-md border border-border bg-card hover:border-primary/40 hover:bg-secondary/40 transition-colors animate-slide-up"
      style={{ animationDelay: `${index * 20}ms` }}
    >
      {/* Sol risk şeridi */}
      <div className={`w-1 shrink-0 ${r.bar}`} aria-hidden />

      <Link to={`/e/${entry.id}`} className="flex-1 min-w-0 grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 px-3 py-2.5">
        {/* Index + ikon */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">#{index + 1}</span>
          <PlatformIcon category={entry.category} withBg />
        </div>

        {/* Hedef + açıklama + risk chip */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {formatTargetDisplay(entry.target, entry.category)}
            </p>
            {entry.verified_target && (
              <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" aria-label={t("entry.verifiedTarget")} />
            )}
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded border ${r.chip}`}
            >
              {r.icon}
              {r.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-2">
            {entry.description}
          </p>
          {/* Mobil mini metrikler */}
          <div className="flex items-center gap-3 mt-1.5 sm:hidden text-[11px] font-mono">
            <span className={`inline-flex items-center gap-1 ${r.text}`}>
              <Star className="h-3 w-3 fill-current" />
              {ratingDisplay}/10
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {entry.comment_count ?? 0}
            </span>
          </div>
        </div>

        {/* Büyük puan — desktop */}
        <div className="hidden sm:flex flex-col items-end justify-center min-w-[68px] px-2 border-l border-border/60">
          <span className={`font-mono text-xl leading-none font-bold tabular-nums ${r.text}`}>
            {ratingDisplay}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground mt-0.5">/ 10</span>
        </div>

        {/* Deneyim sayısı — desktop */}
        <div className="hidden sm:flex flex-col items-center justify-center min-w-[52px] px-2 border-l border-border/60">
          <span className="inline-flex items-center gap-1 text-xs font-mono text-foreground">
            <MessageSquare className="h-3 w-3 text-muted-foreground" />
            {entry.comment_count ?? 0}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground mt-0.5 uppercase tracking-wider">
            {t("table.comments")}
          </span>
        </div>

        {/* Oylama — desktop */}
        <div className="hidden sm:flex items-center justify-center min-w-[80px] pl-2 border-l border-border/60" onClick={(e) => e.preventDefault()}>
          <VoteButtons entryId={entry.id} initialScore={entry.vote_score ?? 0} />
        </div>
      </Link>
    </div>
  );
};

export default EntryCard;
