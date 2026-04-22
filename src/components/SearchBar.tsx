import { useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar = ({ onSearch, placeholder }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-accent/50 rounded-lg opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300" />
        <div className="relative flex items-center bg-card border border-border rounded-lg overflow-hidden">
          <Search className="ml-4 h-5 w-5 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder ?? t("search.placeholder")}
            className="w-full bg-transparent px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none font-mono text-sm"
          />
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
