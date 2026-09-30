import { Fragment, type ReactNode } from "react";
import { cleanUrl, isSameOriginUrl, openExternalUrl } from "@/lib/deepLinking";

// Matches http(s)://… and bare domain.tld/… (no protocol). Stops at
// whitespace and common trailing punctuation.
const URL_RE =
  /\b((?:https?:\/\/|www\.)[^\s<>()]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>()]*)?)/gi;

const TRAILING = /[.,;:!?)\]}'"»]+$/;

const ensureProtocol = (raw: string): string =>
  /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, "")}`;

interface AutoLinkProps {
  href: string;
  children: ReactNode;
}

/**
 * Clickable URL inside user content. External links open directly in the
 * target app (or a new browser tab); internal links navigate normally.
 */
const AutoLink = ({ href, children }: AutoLinkProps) => {
  const internal = isSameOriginUrl(href);
  return (
    <a
      href={href}
      target={internal ? undefined : "_blank"}
      rel="noopener noreferrer nofollow"
      onClick={(e) => {
        if (internal) return;
        e.preventDefault();
        e.stopPropagation();
        if (!openExternalUrl(href)) {
          // Unsafe / unparseable URL — do nothing rather than navigate blindly.
          return;
        }
      }}
      className="text-primary hover:underline break-all"
    >
      {children}
    </a>
  );
};

/**
 * Splits `text` on URLs and renders detected URLs as <AutoLink>.
 * Non-URL segments are preserved as plain strings (whitespace intact).
 */
export const linkifyText = (text: string): ReactNode => {
  if (!text) return text;
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(text)) !== null) {
    const raw = m[0];
    let url = raw;
    // Strip trailing punctuation that's almost certainly not part of the URL.
    const trail = url.match(TRAILING);
    let suffix = "";
    if (trail) {
      suffix = trail[0];
      url = url.slice(0, -suffix.length);
    }
    const start = m.index;
    const end = start + url.length;
    if (start > last) parts.push(text.slice(last, start));
    const href = cleanUrl(ensureProtocol(url)) ?? ensureProtocol(url);
    parts.push(
      <AutoLink key={`${start}-${end}`} href={href}>
        {url}
      </AutoLink>,
    );
    if (suffix) parts.push(suffix);
    last = start + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.map((p, i) => <Fragment key={i}>{p}</Fragment>);
};
