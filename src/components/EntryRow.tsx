import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageSquare, BadgeCheck, Star } from "lucide-react";
import PlatformIcon from "./PlatformIcon";
import VoteButtons from "./VoteButtons";
import { formatTargetDisplay } from "@/lib/platforms";
import { entryHrefSync } from "@/lib/entitySlugs";
import type { EntryRow as EntryT } from "@/hooks/useEntries";

interface Props {
  entry: EntryT;
  index: number;
}

const EntryRow = ({ entry, index }: Props) => {
  const { t } = useTranslation();

  return (
    <tr
      className="border-b border-border/50 hover:bg-secondary/50 transition-colors animate-slide-up [&>td]:py-2.5"
      style={{ animationDelay: `${index * 20}ms` }}
    >
      <td className="py-3 px-4">
        <Link to={entryHrefSync(entry)} className="flex items-center gap-3 group">
          <span className="text-xs text-muted-foreground font-mono w-5">#{index + 1}</span>
          <PlatformIcon category={entry.category} withBg />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {formatTargetDisplay(entry.target, entry.category)}
              </p>
              {entry.verified_target && (
                <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-label={t("entry.verifiedTarget")} />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-md line-clamp-2">{entry.description}</p>
            <div className="flex items-center gap-1 mt-1 sm:hidden text-xs font-mono text-suspicious">
              <Star className="h-3 w-3 fill-current" />
              <span>{entry.avg_rating != null ? `${entry.avg_rating.toFixed(1)}/10` : "—"}</span>
            </div>
          </div>
        </Link>
      </td>
      <td className="py-3 px-4 text-center hidden sm:table-cell">
        <span className="inline-flex items-center gap-1 text-xs font-mono text-suspicious">
          <Star className="h-3.5 w-3.5 fill-current" />
          {entry.avg_rating != null ? `${entry.avg_rating.toFixed(1)}/10` : "—"}
        </span>
      </td>
      <td className="py-3 px-4 text-center hidden md:table-cell">
        <VoteButtons entryId={entry.id} initialScore={entry.vote_score ?? 0} />
      </td>
      <td className="py-3 px-4 text-center hidden md:table-cell">
        <span className="inline-flex items-center justify-center gap-1 text-xs font-mono text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" />
          {entry.comment_count ?? 0}
        </span>
      </td>
    </tr>
  );
};

export default EntryRow;
