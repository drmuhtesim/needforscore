import type { CategoryType } from "@/components/CategorySidebar";

export const platformRegex: Record<Exclude<CategoryType, "all">, RegExp> = {
  score: /^[a-z0-9_.]{3,30}$/i,
  instagram: /^[A-Za-z0-9._]{1,30}$/,
  tiktok: /^[A-Za-z0-9._]{2,24}$/,
  twitter: /^[A-Za-z0-9_]{1,15}$/,
  phone: /^\+?[0-9 ()-]{7,20}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  website: /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?$/i,
};

/** Strip leading @ for handle-style targets so regex stays simple. */
export const cleanTarget = (raw: string): string => {
  const trimmed = raw.trim();
  return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
};

export const normalizeTarget = (raw: string, category: Exclude<CategoryType, "all">): string => {
  const cleaned = cleanTarget(raw).toLowerCase();
  if (category === "phone") return cleaned.replace(/[^\d+]/g, "");
  if (category === "website") return cleaned.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return cleaned;
};

export const validateTarget = (raw: string, category: Exclude<CategoryType, "all">): boolean => {
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
    case "website":
      return raw.startsWith("http") ? raw : `https://${raw}`;
    case "email":
      return `mailto:${raw}`;
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
  return raw;
};
