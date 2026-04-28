import type { CategoryType } from "@/components/CategorySidebar";
import { isValidPhoneNumber, parsePhoneNumberFromString } from "libphonenumber-js";

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
      return `/u/${handle.toLowerCase()}`;
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "tiktok":
      return `https://tiktok.com/@${handle}`;
    case "twitter":
      return `https://x.com/${handle}`;
    case "phone":
      return `tel:${raw.replace(/[^\d+]/g, "")}`;
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
    const parsed = parsePhoneNumberFromString(raw);
    return parsed ? parsed.formatInternational() : raw;
  }
  return raw;
};
