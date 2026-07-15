import TokenLayout from "@/components/token/TokenLayout";
import { GlassCard, GradientHeading, SectionTitle, Prose, Disclaimer } from "@/components/token/TokenUI";

const Whitepaper = () => (
  <TokenLayout
    title="Whitepaper — NeedForScore & $SCORE"
    description="NeedForScore whitepaper: the trust gap on the social internet, how the reputation protocol works, why it's different, and the role of $SCORE."
    canonical="/community-token/whitepaper"
  >
    <GradientHeading>Whitepaper</GradientHeading>
    <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
      A plain-language overview of the mission, the reputation protocol, and the role of the{" "}
      <span className="font-extrabold text-emerald-300">$SCORE</span> Community Token.
    </p>

    <GlassCard className="mt-8">
      <Prose>
        <SectionTitle>1. Vision</SectionTitle>
        <p>
          A safer internet where anyone can evaluate the trustworthiness of a social handle, phone number, or offer
          before making a decision that could cost them money, time, or peace of mind.
        </p>

        <SectionTitle>2. Why NeedForScore has to exist</SectionTitle>
        <p>
          Billions of people interact daily with social handles and phone numbers they can't verify. That trust gap
          has real consequences:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Global online fraud losses have exceeded <strong>$1 trillion</strong>.</li>
          <li>Instagram is the most-abused platform for fake clinics, fake businesses, and impersonation.</li>
          <li>Phone-based fraud is the #1 scam category in emerging markets like Turkey, India, and Brazil.</li>
          <li>Victims have no mechanism to warn other people <em>before</em> the next transaction happens.</li>
        </ul>

        <SectionTitle>3. Founder's note</SectionTitle>
        <p>
          As an anesthesiologist working at a private hospital in Istanbul, we meet patients every week who lost
          thousands of dollars to misleading clinic accounts on Instagram. Turkey welcomes more than 1.2 million
          health tourists a year, and most of those decisions are shaped by unregulated Instagram accounts that no
          one can hold accountable. NeedForScore was built so the next patient can read the truth before they wire
          the money.
        </p>

        <SectionTitle>4. Why existing solutions fall short</SectionTitle>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Google Reviews / Trustpilot</strong> — business-only. You can't search an Instagram handle or a phone number.</li>
          <li><strong>Social platforms</strong> — content-focused, with zero incentive to surface negative signal on their own users.</li>
          <li><strong>Fraud hotlines</strong> — reactive and slow. By the time a number is flagged, thousands are already victims.</li>
        </ul>

        <SectionTitle>5. How the protocol works</SectionTitle>
        <ul className="list-disc list-inside space-y-1">
          <li>Every social handle and phone number gets a persistent, un-fakeable reputation page.</li>
          <li>Users share an experience and rate the identity on a <strong>1–10 trust scale</strong> in under 30 seconds.</li>
          <li>Ratings are <strong>weighted by rater trust</strong> — every rater has their own $SCORE, so low-credibility voters have minimal impact.</li>
          <li>Evidence (screenshots, documents) can be attached and passes moderation before going live.</li>
          <li>The scoring math uses <strong>time-decay, evidence multipliers, and trust weighting</strong> to stay manipulation-resistant.</li>
          <li>Supported identities today: Instagram, X (Twitter), TikTok, phone numbers with country codes, and $SCORE profiles.</li>
        </ul>

        <SectionTitle>6. Why NeedForScore is different</SectionTitle>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Identity that already exists.</strong> @username is unique, permanent, and platform-enforced. We don't create new identities — we add a reputation layer on top, with zero verification cost.</li>
          <li><strong>Weighted trust, not anonymous noise.</strong> Every rater has a $SCORE. Trust flows both ways, forming a real trust graph instead of a shouting match.</li>
          <li><strong>Individual-first, not business-first.</strong> No competitor offers a real-time, scalable trust score at the level of an individual social handle or phone number.</li>
        </ul>

        <SectionTitle>7. Digital identity & reputation</SectionTitle>
        <p>
          Every account, handle, and phone number carries a digital footprint. NeedForScore treats these as identity
          endpoints that can accrue a reputation over time based on real user experiences — moderated for safety and
          abuse resistance.
        </p>

        <SectionTitle>8. $SCORE — the Community Token</SectionTitle>
        <p>
          <strong>$SCORE</strong> exists solely to grow a worldwide community aligned with the mission. It is a
          coordination layer, not a claim on the platform. Tokenomics: <strong>95% community, 5% development</strong>{" "}
          (see the Tokenomics page). Holding $SCORE never buys a better reputation; reputation is earned by real
          experience only.
        </p>

        <SectionTitle>9. Long-term roadmap</SectionTitle>
        <p>
          See the Roadmap page for phased milestones covering platform expansion, localization, security tooling,
          $SCORE distribution, and community programs.
        </p>

        <SectionTitle>10. Transparency</SectionTitle>
        <p>
          Development spending, moderation practices, and material changes will be communicated openly to the
          community.
        </p>

        <SectionTitle>11. Security & privacy</SectionTitle>
        <p>
          User privacy is a first-class concern. Sensitive identifiers such as phone numbers are always masked in
          public views and excluded from search indexing. Full detail is only shown to intentional searchers. Data
          access is protected with row-level security at the database layer.
        </p>
      </Prose>
    </GlassCard>

    <Disclaimer />
  </TokenLayout>
);

export default Whitepaper;
