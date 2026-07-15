import TokenLayout from "@/components/token/TokenLayout";
import { GlassCard, GradientHeading, SectionTitle, Prose, Disclaimer } from "@/components/token/TokenUI";

const Whitepaper = () => (
  <TokenLayout
    title="Whitepaper — NeedForScore Community Token"
    description="The NeedForScore whitepaper: vision, the online fraud problem, digital identity, reputation, Community Token, roadmap, transparency, and security."
    canonical="/community-token/whitepaper"
  >
    <GradientHeading>Whitepaper</GradientHeading>
    <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
      A plain-language overview of the mission, the platform, and the role of the Community Token.
    </p>

    <GlassCard className="mt-8">
      <Prose>
        <SectionTitle>1. Vision</SectionTitle>
        <p>
          A safer internet where anyone can quickly evaluate the trustworthiness of an account, number, or offer
          before making a decision that could cost them money, time, or peace of mind.
        </p>

        <SectionTitle>2. The online fraud problem</SectionTitle>
        <p>
          Fraud is scaling faster than the tools we have to detect it. Victims are usually isolated when they
          encounter a scam. Reports are fragmented across platforms and jurisdictions. NeedForScore aggregates
          community signals so that people are no longer alone at the moment of decision.
        </p>

        <SectionTitle>3. Digital identity</SectionTitle>
        <p>
          Every account, handle, and phone number carries a digital footprint. NeedForScore treats these as identity
          endpoints that can accrue a reputation over time based on real user experiences.
        </p>

        <SectionTitle>4. Reputation</SectionTitle>
        <p>
          Reputation is built from community experiences — ratings, comments, and signals — moderated for safety
          and abuse resistance. It is designed to be legible in seconds and defensible over time.
        </p>

        <SectionTitle>5. Community Token</SectionTitle>
        <p>
          The Community Token exists solely to grow a worldwide community aligned with the mission. It is not a
          claim on the platform. Tokenomics: 95% community, 5% development (see the Tokenomics page for details).
        </p>

        <SectionTitle>6. Long-term roadmap</SectionTitle>
        <p>
          See the Roadmap page for phased milestones covering platform expansion, localization, security tooling,
          and community programs.
        </p>

        <SectionTitle>7. Transparency</SectionTitle>
        <p>
          Development spending, moderation practices, and material changes will be communicated openly to the
          community.
        </p>

        <SectionTitle>8. Security</SectionTitle>
        <p>
          User privacy is a first-class concern. Sensitive identifiers (such as phone numbers) are always masked in
          public views and excluded from search indexing. Data access is protected with row-level security at the
          database layer.
        </p>
      </Prose>
    </GlassCard>

    <Disclaimer />
  </TokenLayout>
);

export default Whitepaper;
