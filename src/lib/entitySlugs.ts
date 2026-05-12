// Entity-based SEO URL helpers.
// Public canonical routes:
//   /score/:username
//   /instagram/:handle
//   /tiktok/:handle
//   /x/:handle           (display alias for "twitter" category)
//   /phone/:slug         (masked, never raw number)
//
// Phone slugs follow: tr-90-xx-{last2}-{8-hex hash}
// Deterministic SHA-256 over the E.164 normalized number, so the same phone
// always maps to the same slug. The slug is one-way — you cannot reverse it
// to recover the full number.

import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { CategoryType } from "@/components/CategorySidebar";

export type EntityCategory = Exclude<CategoryType, "all">;

/** URL segment used in routes for a given DB category. */
export const categoryToSegment: Record<EntityCategory, string> = {
  score: "score",
  instagram: "instagram",
  tiktok: "tiktok",
  twitter: "x",
  phone: "phone",
};

/** Reverse map: URL segment → DB category. */
export const segmentToCategory: Record<string, EntityCategory> = {
  score: "score",
  instagram: "instagram",
  tiktok: "tiktok",
  x: "twitter",
  twitter: "twitter", // tolerate legacy
  phone: "phone",
};

const hexFromBuffer = (buf: ArrayBuffer): string =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

/** Async SHA-256 → hex (browser-safe). */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return hexFromBuffer(buf);
}

/**
 * Build the public slug for a phone target. `raw` should already be the
 * normalized E.164 form stored in `entries.target_normalized`.
 *
 * Format: `{cc}-xx-{last2}-{8hex}`
 *   cc      ISO country code (lowercase, e.g. "tr") or "intl" if unknown
 *   last2   last 2 digits of national number (always exposed, low risk)
 *   8hex    first 8 chars of sha256(E.164)
 */
export async function buildPhoneSlug(rawE164: string): Promise<string> {
  const parsed = parsePhoneNumberFromString(rawE164);
  const cc = parsed?.country?.toLowerCase() ?? "intl";
  const national = (parsed?.nationalNumber ?? rawE164).toString().replace(/\D/g, "");
  const last2 = national.slice(-2).padStart(2, "x");
  const hash = (await sha256Hex(rawE164)).slice(0, 8);
  return `${cc}-xx-${last2}-${hash}`;
}

/** Build the canonical entity URL for a given category + target. */
export async function buildEntityUrl(
  category: EntityCategory,
  rawTarget: string,
): Promise<string> {
  const seg = categoryToSegment[category];
  if (category === "phone") {
    const slug = await buildPhoneSlug(rawTarget);
    return `/${seg}/${slug}`;
  }
  const handle = rawTarget.trim().replace(/^@/, "").toLowerCase();
  return `/${seg}/${encodeURIComponent(handle)}`;
}

/**
 * Synchronous variant for non-phone categories where we don't need crypto.
 * Returns null if called for "phone" — caller must use the async version.
 */
export function buildEntityUrlSync(
  category: EntityCategory,
  rawTarget: string,
): string | null {
  if (category === "phone") return null;
  const seg = categoryToSegment[category];
  const handle = rawTarget.trim().replace(/^@/, "").toLowerCase();
  return `/${seg}/${encodeURIComponent(handle)}`;
}

/**
 * Synchronous "best-effort" canonical URL for a single entry.
 * Returns the entity URL when computable without crypto (handles), else
 * `/e/:id` which is always a permanent redirect to the canonical entity URL.
 */
export function entryHrefSync(entry: {
  id: string;
  category: EntityCategory;
  target: string;
}): string {
  const sync = buildEntityUrlSync(entry.category, entry.target);
  return sync ?? `/e/${entry.id}`;
}

/** Human-readable label for a category. */
export const categoryLabel: Record<EntityCategory, string> = {
  score: "Score",
  instagram: "Instagram",
  tiktok: "TikTok",
  twitter: "X (Twitter)",
  phone: "Telefon",
};
