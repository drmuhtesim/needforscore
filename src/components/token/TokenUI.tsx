import { ReactNode } from "react";

export const GlassCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div
    className={`relative rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-background/40 backdrop-blur-md p-6 sm:p-8 shadow-[0_8px_40px_-12px_rgba(16,185,129,0.25)] ${className}`}
  >
    {children}
  </div>
);

export const GradientHeading = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <h1
    className={`text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent ${className}`}
  >
    {children}
  </h1>
);

export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-8 mb-3">{children}</h2>
);

export const Prose = ({ children }: { children: ReactNode }) => (
  <div className="text-base leading-relaxed text-muted-foreground space-y-4">{children}</div>
);

export const Disclaimer = () => (
  <div className="mt-10 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-amber-200/90 leading-relaxed">
    <div className="font-bold text-amber-300 mb-1">Disclaimer</div>
    Participation involves risk. The Community Token does not represent ownership, equity, or a security interest
    in NeedForScore. Nothing on this page is financial advice. Please do your own research and understand the risks
    before participating.
  </div>
);
