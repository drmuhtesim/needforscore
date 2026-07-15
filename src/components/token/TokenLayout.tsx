import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import Header from "@/components/Header";
import MobileBottomBar from "@/components/MobileBottomBar";
import SEO from "@/components/SEO";

const NAV = [
  { to: "/community-token", label: "Community Token" },
  { to: "/community-token/why", label: "Why" },
  { to: "/community-token/tokenomics", label: "Tokenomics" },
  { to: "/community-token/whitepaper", label: "Whitepaper" },
  { to: "/community-token/roadmap", label: "Roadmap" },
  { to: "/community-token/faq", label: "FAQ" },
];

interface Props {
  children: ReactNode;
  title: string;
  description: string;
  canonical: string;
}

const TokenLayout = ({ children, title, description, canonical }: Props) => {
  return (
    <div className="min-h-screen bg-background flex flex-col pb-14 lg:pb-0">
      <SEO title={title} description={description} canonical={canonical} />
      <Header />

      {/* Web3 emerald ambient background */}
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-[120px]" />
          <div className="absolute top-40 -right-24 h-96 w-96 rounded-full bg-teal-400/15 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-300/10 blur-[120px]" />
        </div>

        {/* Sub-nav */}
        <nav className="relative border-b border-emerald-500/20 bg-background/60 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 overflow-x-auto">
            <ul className="flex items-center gap-1 py-2 whitespace-nowrap">
              {NAV.map((n) => (
                <li key={n.to}>
                  <NavLink
                    to={n.to}
                    end={n.to === "/community-token"}
                    className={({ isActive }) =>
                      `px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-200 ring-1 ring-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-emerald-500/10"
                      }`
                    }
                  >
                    {n.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <main className="relative max-w-4xl mx-auto px-4 py-10 sm:py-14">{children}</main>
      </div>

      <MobileBottomBar />
    </div>
  );
};

export default TokenLayout;
