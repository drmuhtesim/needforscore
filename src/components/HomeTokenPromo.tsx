import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";

/**
 * Homepage promo section for the Community Token.
 * Web3 emerald aesthetic — intentionally distinct from the main product surface,
 * but harmless and dismissible-feeling by sitting inline between existing content.
 */
const HomeTokenPromo = () => {
  return (
    <section className="px-4 py-6 sm:py-8 border-b border-border" aria-label="Community Token">
      <div className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-background to-teal-500/10 backdrop-blur-md">
        {/* glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -left-10 h-48 w-48 rounded-full bg-emerald-400/25 blur-3xl animate-pulse" />
          <div className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl animate-pulse" style={{ animationDelay: "1.2s" }} />
        </div>

        <div className="relative flex flex-col sm:flex-row items-center gap-5 p-5 sm:p-7">
          {/* Token icon placeholder */}
          <div className="shrink-0 h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-emerald-300 to-teal-500 flex items-center justify-center text-background font-black text-2xl sm:text-3xl shadow-[0_0_40px_rgba(16,185,129,0.55)] ring-2 ring-emerald-300/50">
            S
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 text-emerald-300 text-[10px] font-bold uppercase tracking-wide mb-2">
              <Sparkles className="h-3 w-3" />
              New · Community Token
            </div>
            <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-200 via-emerald-300 to-teal-300 bg-clip-text text-transparent">
              Join the global community fighting online scams.
            </h2>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground max-w-xl">
              The Community Token unites people worldwide around NeedForScore's mission. Product first — community always.
            </p>
          </div>

          <div className="shrink-0 flex flex-col gap-2">
            <Link
              to="/community-token"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-background bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_25px_rgba(16,185,129,0.45)] hover:shadow-[0_0_35px_rgba(16,185,129,0.75)] transition-all"
            >
              Learn More <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/10 transition-colors"
            >
              Launch App <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeTokenPromo;
