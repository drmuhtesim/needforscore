// Yorumların içeriğine eklenen "— ...: X/10" satırından skoru çekip
// bir başlığın ortalama puanını hesaplar.
// CommentForm, yorumun sonuna `\n\n— ${t("entry.yourScore")}: ${rating}/10`
// satırını ekliyor; dil bağımsız olarak satırın sonundaki `N/10` desenini yakalıyoruz.
const RATING_RE = /(\d{1,2})\s*\/\s*10\s*$/m;

export const extractRatingFromComment = (content: string): number | null => {
  if (!content) return null;
  const m = content.match(RATING_RE);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 1 || n > 10) return null;
  return n;
};

export const averageRating = (contents: string[]): number | null => {
  const nums = contents
    .map(extractRatingFromComment)
    .filter((n): n is number => n !== null);
  if (nums.length === 0) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  return Math.round((sum / nums.length) * 10) / 10; // 1 ondalık
};
