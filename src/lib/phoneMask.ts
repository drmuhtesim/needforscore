// Phone masking helpers. Public UI must NEVER show full phone numbers — only
// country code (when parseable) + last 2 digits, everything in between as `*`.
//
// Examples:
//   +905321234567 → "+90 532 *** ** 67"
//   +14155551234  → "+1 415 *** ** 34"
//   garbled       → "*** ** 67"

import { parsePhoneNumberFromString } from "libphonenumber-js";

const maskNationalDigits = (national: string): string => {
  const digits = national.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  const last2 = digits.slice(-2);
  const head = digits.slice(0, Math.min(3, digits.length - 2));
  const middleLen = digits.length - head.length - 2;
  const middle = "*".repeat(Math.max(middleLen, 3));
  // Format as "head *** ** last2" for readability when possible
  if (head.length === 3 && middleLen >= 3) {
    const midA = "*".repeat(3);
    const midB = "*".repeat(Math.max(middleLen - 3, 2));
    return `${head} ${midA} ${midB} ${last2}`;
  }
  return `${head} ${middle} ${last2}`.replace(/\s+/g, " ").trim();
};

export const maskPhone = (raw: string): string => {
  if (!raw) return "";
  const parsed = parsePhoneNumberFromString(raw);
  if (parsed?.countryCallingCode && parsed.nationalNumber) {
    return `+${parsed.countryCallingCode} ${maskNationalDigits(parsed.nationalNumber.toString())}`;
  }
  // Fallback: just mask everything but last 2
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 2) return `**${digits}`;
  return `*** ** ${digits.slice(-2)}`;
};

/** Compact form for tight cells/rows. */
export const maskPhoneShort = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 2) return `**${digits}`;
  return `*** ** ${digits.slice(-2)}`;
};
