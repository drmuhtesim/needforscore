import { Award } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Generation, generationLabel, generationLabelEn, generationStyles } from "@/lib/badges";

interface Props {
  generation: Generation;
  size?: "sm" | "md";
}

const GenerationBadge = ({ generation, size = "sm" }: Props) => {
  const { i18n } = useTranslation();
  if (!generation) return null;
  const isEn = i18n.language?.startsWith("en");
  const label = isEn ? generationLabelEn(generation) : generationLabel(generation);
  const sizeCls = size === "md" ? "text-xs px-2.5 py-1" : "text-[10px] px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-mono uppercase tracking-wider ${sizeCls} ${generationStyles(generation)}`}
      title={label}
    >
      <Award className={size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"} />
      {label}
    </span>
  );
};

export default GenerationBadge;
