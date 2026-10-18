import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";
import { getCountryCallingCode, type Country } from "libphonenumber-js";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface Option {
  value?: Country;
  label: string;
  divider?: boolean;
}

interface Props {
  value?: Country;
  onChange: (c?: Country) => void;
  options: Option[];
  disabled?: boolean;
}

const flag = (cc: string) =>
  cc.toUpperCase().replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));

const norm = (s: string) =>
  s.toLocaleLowerCase("tr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i");

const PRIORITY: Country[] = ["TR", "DE", "US", "GB", "NL", "FR", "AZ"];

const PhoneCountrySelect = ({ value, onChange, options, disabled }: Props) => {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const lang = i18n.language?.startsWith("tr") ? "tr" : "en";

  const items = useMemo(() => {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames([lang], { type: "region" });
    } catch {
      names = null;
    }
    const list = options
      .filter((o) => o.value && !o.divider)
      .map((o) => {
        const c = o.value as Country;
        const name = names?.of(c) ?? o.label;
        const code = getCountryCallingCode(c);
        return { c, name, code, search: `${norm(name)} ${norm(o.label)} ${c.toLowerCase()} +${code} ${code}` };
      })
      .sort((a, b) => a.name.localeCompare(b.name, lang));
    const top = PRIORITY.map((p) => list.find((x) => x.c === p)).filter(Boolean) as typeof list;
    return [...top, ...list.filter((x) => !PRIORITY.includes(x.c))];
  }, [options, lang]);

  const current = items.find((x) => x.c === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex items-center gap-1.5 shrink-0 h-8 px-2 rounded border border-border bg-secondary/50 hover:bg-secondary text-sm font-mono"
          aria-label={t("entry.phoneCountry", { defaultValue: "Ülke seç" }) as string}
        >
          <span className="text-base leading-none">{value ? flag(value) : "🌐"}</span>
          <span className="text-foreground">{current ? `+${current.code}` : "+"}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command
          filter={(val, search) => {
            const q = norm(search.trim()).replace(/^\+/, "");
            if (!q) return 1;
            const item = items.find((x) => x.c === val);
            if (!item) return 0;
            if (item.code === q) return 1;
            if (norm(item.name).startsWith(q)) return 0.9;
            return item.search.includes(q) ? 0.5 : 0;
          }}
        >
          <CommandInput placeholder={t("entry.phoneCountrySearch", { defaultValue: "Ülke adı veya kodu (ör. 90)" }) as string} />
          <CommandList className="max-h-72">
            <CommandEmpty>{t("entry.phoneCountryNone", { defaultValue: "Ülke bulunamadı" })}</CommandEmpty>
            {items.map((x) => (
              <CommandItem
                key={x.c}
                value={x.c}
                onSelect={() => {
                  onChange(x.c);
                  setOpen(false);
                }}
                className="flex items-center gap-2"
              >
                <span className="text-base leading-none">{flag(x.c)}</span>
                <span className="flex-1 truncate">{x.name}</span>
                <span className="font-mono text-xs text-muted-foreground">+{x.code}</span>
                {x.c === value && <Check className="h-3.5 w-3.5 text-primary" />}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default PhoneCountrySelect;
