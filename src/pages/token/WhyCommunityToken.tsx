import TokenLayout from "@/components/token/TokenLayout";
import { GlassCard, GradientHeading, SectionTitle, Prose, Disclaimer } from "@/components/token/TokenUI";

const WhyCommunityToken = () => (
  <TokenLayout
    title="Why a Community Token? — NeedForScore"
    description="Why NeedForScore introduces a Community Token: coordination, global reach, and shared incentives for a scam-free internet."
    canonical="/community-token/why"
  >
    <GradientHeading>Why a Community Token?</GradientHeading>
    <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
      Online fraud is a global problem. A global community needs a coordination layer.
    </p>

    <GlassCard className="mt-8">
      <Prose>
        <SectionTitle>The problem</SectionTitle>
        <p>
          Scammers move fast, cross borders instantly, and target people who have no easy way to check whether an
          account, phone number, or offer is legitimate. Individual reports are scattered. Trust signals are siloed.
        </p>
        <SectionTitle>Why a token helps</SectionTitle>
        <p>
          A Community Token gives a distributed, worldwide audience a shared symbol to rally around. It makes it
          easier to:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Grow awareness of the platform in new regions.</li>
          <li>Encourage contributors who care about the mission.</li>
          <li>Fund development, infrastructure, and security work transparently.</li>
        </ul>
        <SectionTitle>What it is not</SectionTitle>
        <p>
          The token does not represent ownership of NeedForScore. It does not grant equity, dividends, or governance
          over the platform's product decisions. Product direction is always driven by user safety.
        </p>
      </Prose>
    </GlassCard>

    <Disclaimer />
  </TokenLayout>
);

export default WhyCommunityToken;
