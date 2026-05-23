import type { CategoryType } from "@/components/CategorySidebar";
import { isValidPhoneNumber, parsePhoneNumberFromString } from "libphonenumber-js";
import { maskPhone } from "@/lib/phoneMask";

export const platformRegex: Record<Exclude<CategoryType, "all" | "phone">, RegExp> = {
  score: /^[a-z0-9_.]{3,30}$/i,
  instagram: /^[A-Za-z0-9._]{1,30}$/,
  tiktok: /^[A-Za-z0-9._]{2,24}$/,
  twitter: /^[A-Za-z0-9_]{1,15}$/,
};

/** Strip leading @ for handle-style targets so regex stays simple. */
export const cleanTarget = (raw: string): string => {
  const trimmed = raw.trim();
  return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
};

export const normalizeTarget = (raw: string, category: Exclude<CategoryType, "all">): string => {
  const cleaned = cleanTarget(raw).toLowerCase();
  if (category === "phone") {
    const parsed = parsePhoneNumberFromString(raw);
    return parsed ? parsed.number : cleaned.replace(/[^\d+]/g, "");
  }
  return cleaned;
};

export const validateTarget = (raw: string, category: Exclude<CategoryType, "all">): boolean => {
  if (category === "phone") {
    return isValidPhoneNumber(raw);
  }
  const cleaned = cleanTarget(raw);
  return platformRegex[category].test(cleaned);
};

export const buildProfileUrl = (raw: string, category: Exclude<CategoryType, "all">): string | null => {
  const handle = cleanTarget(raw);
  switch (category) {
    case "score":
      return `/score/${handle.toLowerCase()}`;
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "tiktok":
      return `https://tiktok.com/@${handle}`;
    case "twitter":
      return `https://x.com/${handle}`;
    case "phone":
      // Never expose the raw number via tel: links — privacy-first.
      return null;
    default:
      return null;
  }
};

export const formatTargetDisplay = (raw: string, category: Exclude<CategoryType, "all">): string => {
  const cleaned = cleanTarget(raw);
  if (category === "score" || category === "instagram" || category === "tiktok" || category === "twitter") {
    return `@${cleaned}`;
  }
  if (category === "phone") {
    return maskPhone(raw);
  }
  return raw;
};

export const formatTargetDisplay = (raw: string, category: Exclude<CategoryType, "all">): string => {
  const cleaned = cleanTarget(raw);
  if (category === "score" || category === "instagram" || category === "tiktok" || category === "twitter") {
    return `@${cleaned}`;
  }
  if (category === "phone") {
    const parsed = parsePhoneNumberFromString(raw);
    return parsed ? parsed.formatInternational() : raw;
  }
  return raw;
};

/**
 * Canonical "stored" form of a target — used both when persisting to the DB
 * and when previewing back to the user. Handles get cleaned + lowercased,
 * phone numbers fall back to E.164 (or stripped) when parseable.
 *
 * Keep this in sync with `formatTargetPreview` so what the user sees in the
 * confirmation dialog matches what is actually written to the DB.
 */
export const canonicalizeTarget = (raw: string, category: Exclude<CategoryType, "all">): string => {
  if (category === "phone") {
    const parsed = parsePhoneNumberFromString(raw);
    return parsed ? parsed.number : raw.trim().replace(/[^\d+]/g, "");
  }
  return cleanTarget(raw).toLowerCase();
};

/**
 * User-facing preview of a target. Always derived from the same canonical
 * value used at submit time, with consistent truncation rules.
 */
export const formatTargetPreview = (
  raw: string,
  category: Exclude<CategoryType, "all">,
  maxLen = 60,
): string => {
  const canonical = canonicalizeTarget(raw, category);
  let display: string;
  if (category === "phone") {
    const parsed = parsePhoneNumberFromString(canonical);
    display = parsed ? parsed.formatInternational() : canonical;
  } else {
    display = canonical ? `@${canonical}` : "";
  }
  if (display.length <= maxLen) return display;
  return `${display.slice(0, Math.max(0, maxLen - 1))}…`;
};
