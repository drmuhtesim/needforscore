import TokenLayout from "@/components/token/TokenLayout";
import { GlassCard, GradientHeading, Disclaimer } from "@/components/token/TokenUI";

const PHASES = [
  {
    tag: "Phase 1",
    title: "Foundations",
    items: [
      "Reputation platform live at needforscore.com",
      "Community entries, ratings, and moderation",
      "Privacy-first phone lookup",
    ],
  },
  {
    tag: "Phase 2",
    title: "Community Token launch",
    items: [
      "Community Token announcement",
      "Tokenomics + whitepaper published",
      "Global community programs",
    ],
  },
  {
    tag: "Phase 3",
    title: "Scale",
    items: [
      "Localization to additional languages",
      "Advanced trust-score signals",
      "AI-assisted scam pattern detection",
    ],
  },
  {
    tag: "Phase 4",
    title: "Ecosystem",
    items: [
      "Public APIs for trust signals",
      "Partnerships with consumer protection groups",
      "Long-term sustainability programs",
    ],
  },
];

const Roadmap = () => (
  <TokenLayout
    title="Roadmap — NeedForScore Community Token"
    description="The phased roadmap for NeedForScore and its Community Token: foundations, launch, scale, and ecosystem."
    canonical="/community-token/roadmap"
  >
    <GradientHeading>Roadmap</GradientHeading>
    <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
      A phased path — always product-first, community-supported.
    </p>

    <div className="mt-8 space-y-4">
      {PHASES.map((p) => (
        <GlassCard key={p.tag}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <div className="shrink-0">
              <div className="inline-flex px-3 py-1 rounded-full text-xs font-bold text-emerald-200 border border-emerald-400/40 bg-emerald-500/10">
                {p.tag}
              </div>
              <div className="mt-2 font-bold text-foreground text-lg">{p.title}</div>
            </div>
            <ul className="flex-1 space-y-1.5 text-sm text-muted-foreground">
              {p.items.map((i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-400 mt-0.5">◆</span>
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </GlassCard>
      ))}
    </div>

    <Disclaimer />
  </TokenLayout>
);

export default Roadmap;
