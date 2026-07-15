import TokenLayout from "@/components/token/TokenLayout";
import { GlassCard, GradientHeading, SectionTitle, Prose, Disclaimer } from "@/components/token/TokenUI";

const Tokenomics = () => (
  <TokenLayout
    title="Tokenomics — NeedForScore Community Token"
    description="Community Token allocation: 95% community, 5% development. Transparent, mission-first tokenomics."
    canonical="/community-token/tokenomics"
  >
    <GradientHeading>Tokenomics</GradientHeading>
    <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
      A simple, community-first allocation. No hidden treasury, no insider tranches.
    </p>

    <div className="grid gap-4 sm:grid-cols-2 mt-8">
      <GlassCard className="text-center">
        <div className="text-6xl font-extrabold bg-gradient-to-b from-emerald-300 to-teal-400 bg-clip-text text-transparent">
          95%
        </div>
        <div className="mt-2 font-bold text-foreground">Community</div>
        <div className="text-sm text-muted-foreground mt-1">
          Belongs to the global NeedForScore community.
        </div>
      </GlassCard>
      <GlassCard className="text-center">
        <div className="text-6xl font-extrabold bg-gradient-to-b from-emerald-300 to-teal-400 bg-clip-text text-transparent">
          5%
        </div>
        <div className="mt-2 font-bold text-foreground">Development</div>
        <div className="text-sm text-muted-foreground mt-1">
          Reserved for building, securing, and scaling the platform.
        </div>
      </GlassCard>
    </div>

    <GlassCard className="mt-6">
      <Prose>
        <SectionTitle>How the 5% development allocation is used</SectionTitle>
        <ul className="list-disc list-inside space-y-1">
          <li>Platform development and feature work</li>
          <li>Infrastructure and hosting</li>
          <li>Security, moderation, and abuse prevention</li>
          <li>Team expansion</li>
          <li>Global growth and localization</li>
        </ul>
        <SectionTitle>Community allocation</SectionTitle>
        <p>
          The remaining 95% of supply belongs to the community. It is intended to circulate freely, reward
          contributors, and unite the people who share NeedForScore's mission worldwide.
        </p>
      </Prose>
    </GlassCard>

    <Disclaimer />
  </TokenLayout>
);

export default Tokenomics;
