// Generation badge thresholds — based on signup_order in profiles
export type Generation = 1 | 2 | 3 | null;

export const generationFromOrder = (order: number | null | undefined): Generation => {
  if (!order || order <= 0) return null;
  if (order <= 10000) return 1;
  if (order <= 50000) return 2;
  if (order <= 100000) return 3;
  return null;
};

export const generationLabel = (g: Generation): string => {
  if (g === 1) return "1. Nesil";
  if (g === 2) return "2. Nesil";
  if (g === 3) return "3. Nesil";
  return "";
};

export const generationLabelEn = (g: Generation): string => {
  if (g === 1) return "Gen 1";
  if (g === 2) return "Gen 2";
  if (g === 3) return "Gen 3";
  return "";
};

// Tailwind color classes per generation
export const generationStyles = (g: Generation) => {
  if (g === 1) return "border-primary/50 bg-primary/10 text-primary";
  if (g === 2) return "border-accent/50 bg-accent/10 text-accent";
  if (g === 3) return "border-suspicious/50 bg-suspicious/10 text-suspicious";
  return "border-border bg-secondary text-muted-foreground";
};
