import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/use-toast";
import { looksLikeUrl } from "@/lib/socialUrlParser";
import { resolveSocialUrl } from "@/lib/resolveSocialUrl";


interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  value?: string;
}

const SearchBar = ({ onSearch, placeholder, value }: SearchBarProps) => {
  const [query, setQuery] = useState(value ?? "");
  const [resolving, setResolving] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  // Try to interpret the input as a social URL. Returns true when handled.
  const tryHandleSocialUrl = async (raw: string): Promise<boolean> => {
    if (!looksLikeUrl(raw)) return false;
    setResolving(true);
    try {
      const { result } = await resolveSocialUrl(raw);
      if (!result) {
        toast({ title: t("search.parseError") as string, variant: "destructive" });
        return true;
      }
      if (!result.username) {
        // Recognized platform but the owner couldn't be auto-detected
        // (Instagram serves only a SPA shell to unauthenticated clients).
        // Open the "create entry" flow with the platform preselected so the
        // user just types the creator's handle.
        if (result.category) {
          toast({
            title: t("search.platformDetected", { platform: result.platform }) as string,
            description: t("search.enterUsername") as string,
          });
          navigate(`/?cat=${result.category}&newEntry=1`);
          return true;
        }
        toast({
          title: t("search.parseError") as string,
          description: result.platform,
          variant: "destructive",
        });
        return true;
      }
      if (result.category) {
        navigate(`/?q=${encodeURIComponent(result.username)}&cat=${result.category}`);
      } else {
        navigate(`/?q=${encodeURIComponent(result.username)}`);
      }
      setQuery(result.username);
      return true;
    } finally {
      setResolving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = query.trim();
    if (!v) return;
    if (await tryHandleSocialUrl(v)) return;
    onSearch(v);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (!pasted || !looksLikeUrl(pasted)) return;
    e.preventDefault();
    setQuery(pasted);
    setTimeout(() => { void tryHandleSocialUrl(pasted); }, 0);
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
          {query && !resolving && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={t("search.clear") as string}
              className="mr-1 p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {resolving && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
          )}
          <button
            type="submit"
            disabled={resolving}
            className="px-6 py-3.5 bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors flex-shrink-0 disabled:opacity-60"
          >
            {t("search.button")}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;
