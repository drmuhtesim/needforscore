import { Helmet } from "react-helmet-async";

export const SITE_URL = "https://www.needforscore.com";
export const SITE_NAME = "Score (NeedForScore)";
export const DEFAULT_OG_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/ZIFI5J5XtxTPJYoUuTh2VF2lc3v1/social-images/social-1777753002392-IMG_8199.webp";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: "website" | "profile" | "article";
  noindex?: boolean;
  /** Stringified JSON-LD blocks. Pass an array to render multiple. */
  jsonLd?: object | object[];
}

const absUrl = (path?: string) => {
  if (!path) return SITE_URL;
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

const SEO = ({
  title,
  description,
  canonical,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  noindex,
  jsonLd,
}: SEOProps) => {
  const url = canonical ? absUrl(canonical) : undefined;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {url && <link rel="canonical" href={url} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* OpenGraph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
