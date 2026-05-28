import { Helmet } from "react-helmet-async";
import { SITE_NAME } from "@/components/SEO";

/**
 * Minimal head for private/auth/internal routes:
 *  - sets a sensible <title> and <meta name="description">
 *  - tells crawlers to skip the page (noindex,nofollow)
 *  - drops social previews to the sitewide default (no per-route og:image needed)
 */
const NoindexHead = ({
  title,
  description = "Score (NeedForScore) özel/iç sayfası. Bu alan arama motorlarınca dizine eklenmez.",
}: {
  title: string;
  description?: string;
}) => {
  const t = `${title} | ${SITE_NAME}`;
  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="noindex, nofollow" />
      <meta property="og:title" content={t} />
      <meta property="og:description" content={description} />
      <meta name="twitter:title" content={t} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};

export default NoindexHead;
