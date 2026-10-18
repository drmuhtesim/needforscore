import { getExampleNumber, parsePhoneNumberFromString, isValidPhoneNumber, type CountryCode as Country } from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";

export type PhoneLengthStatus =
  | { kind: "empty" }
  | { kind: "ok" }
  | { kind: "short"; expected: number; diff: number }
  | { kind: "long"; expected: number; diff: number }
  | { kind: "invalid"; expected: number | null };

/** Expected national-number digit count for a country (from mobile example). */
export const expectedDigits = (country?: Country): number | null => {
  if (!country) return null;
  const ex = getExampleNumber(country, examples);
  return ex ? ex.nationalNumber.length : null;
};

export const phoneLengthStatus = (value: string, country?: Country): PhoneLengthStatus => {
  if (!value || value.replace(/\D/g, "").length === 0) return { kind: "empty" };
  if (isValidPhoneNumber(value)) return { kind: "ok" };
  const parsed = parsePhoneNumberFromString(value);
  const c = (parsed?.country as Country | undefined) ?? country;
  const expected = expectedDigits(c);
  const national = parsed?.nationalNumber?.length ?? 0;
  if (expected == null || national === 0) return { kind: "invalid", expected };
  if (national < expected) return { kind: "short", expected, diff: expected - national };
  if (national > expected) return { kind: "long", expected, diff: national - expected };
  return { kind: "invalid", expected };
};
