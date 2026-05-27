import { Helmet } from "react-helmet-async";
import { SITE_NAME } from "@/components/SEO";

/**
 * Minimal head for private/auth/internal routes:
 *  - sets a sensible <title>
 *  - tells crawlers to skip the page (noindex,nofollow)
 *  - drops social previews to the sitewide default (no per-route og:image needed)
 */
const NoindexHead = ({ title }: { title: string }) => {
  const t = `${title} | ${SITE_NAME}`;
  return (
    <Helmet>
      <title>{t}</title>
      <meta name="robots" content="noindex, nofollow" />
      <meta property="og:title" content={t} />
      <meta name="twitter:title" content={t} />
    </Helmet>
  );
};

export default NoindexHead;
