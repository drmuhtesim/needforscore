import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/use-toast";
import { parseSocialUrl, looksLikeUrl } from "@/lib/socialUrlParser";
import { categoryToSegment } from "@/lib/entitySlugs";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  value?: string;
}

const SearchBar = ({ onSearch, placeholder, value }: SearchBarProps) => {
  const [query, setQuery] = useState(value ?? "");
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  // Try to interpret the input as a social media URL. Returns true if we
  // handled it (navigated or showed an error toast).
  const tryHandleSocialUrl = (raw: string): boolean => {
    if (!looksLikeUrl(raw)) return false;
    const parsed = parseSocialUrl(raw);
    if (!parsed) {
      toast({
        title: t("search.parseError") as string,
        variant: "destructive",
      });
      return true;
    }
    if (parsed.category) {
      // Send to home with the username pre-filled + category locked so the
      // existing "create page" flow fires when nothing matches.
      const seg = categoryToSegment[parsed.category];
      navigate(`/?q=${encodeURIComponent(parsed.username)}&cat=${seg}`);
    } else {
      navigate(`/?q=${encodeURIComponent(parsed.username)}`);
    }
    setQuery(parsed.username);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = query.trim();
    if (!v) return;
    if (tryHandleSocialUrl(v)) return;
    onSearch(v);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (!pasted || !looksLikeUrl(pasted)) return;
    e.preventDefault();
    setQuery(pasted);
    // Defer so React commits the input value before navigating.
    setTimeout(() => tryHandleSocialUrl(pasted), 0);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-accent/50 rounded-lg opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300" />
        <div className="relative flex items-center bg-card border border-border rounded-lg overflow-hidden">
          <Search className="ml-4 h-5 w-5 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder ?? (t("search.placeholder") as string)}
            className="w-full bg-transparent px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none font-mono text-sm min-w-0"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={t("search.clear") as string}
              className="mr-1 p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-3.5 bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            {t("search.button")}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;
