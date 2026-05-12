import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import {
  buildEntityUrlSync,
  buildPhoneSlug,
  categoryToSegment,
  type EntityCategory,
} from "@/lib/entitySlugs";

interface Props {
  category: EntityCategory;
  /** Raw target (handle for socials, E.164 for phone, username for score). */
  target: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Renders an internal link to the canonical entity aggregate page:
 *   /score/:username, /instagram/:handle, /tiktok/:handle, /x/:handle, /phone/:slug
 *
 * For phone targets the slug is computed asynchronously (SHA-256), so the
 * link renders as plain text until resolved.
 */
const EntityLink = ({ category, target, className, children }: Props) => {
  const [href, setHref] = useState<string | null>(() => buildEntityUrlSync(category, target));

  useEffect(() => {
    if (category !== "phone") {
      setHref(buildEntityUrlSync(category, target));
      return;
    }
    let cancelled = false;
    (async () => {
      const slug = await buildPhoneSlug(target);
      if (!cancelled) setHref(`/${categoryToSegment.phone}/${slug}`);
    })();
    return () => {
      cancelled = true;
    };
  }, [category, target]);

  if (!href) {
    return <span className={className}>{children}</span>;
  }
  return (
    <Link to={href} className={className}>
      {children ?? (
        <span className="inline-flex items-center gap-1">
          Tüm entry'ler <ArrowUpRight className="h-3 w-3" />
        </span>
      )}
    </Link>
  );
};

export default EntityLink;
