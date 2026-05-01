// Persists a "user wanted to add an entry but had to sign up first" intent
// across the auth redirect, so we can re-open AddEntryDialog after login
// with the original search query pre-filled.

export const PENDING_ADD_ENTRY_KEY = "score:pendingAddEntry";

export interface PendingAddEntry {
  target: string;
  category?: string;
  // Unix ms — used to expire stale intents (e.g. >30 minutes old).
  ts: number;
}

const MAX_AGE_MS = 30 * 60 * 1000;

export const setPendingAddEntry = (data: Omit<PendingAddEntry, "ts">) => {
  try {
    sessionStorage.setItem(
      PENDING_ADD_ENTRY_KEY,
      JSON.stringify({ ...data, ts: Date.now() } satisfies PendingAddEntry)
    );
  } catch {
    // ignore storage errors
  }
};

export const consumePendingAddEntry = (): PendingAddEntry | null => {
  try {
    const raw = sessionStorage.getItem(PENDING_ADD_ENTRY_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_ADD_ENTRY_KEY);
    const parsed = JSON.parse(raw) as PendingAddEntry;
    if (!parsed?.target) return null;
    if (Date.now() - (parsed.ts ?? 0) > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};
