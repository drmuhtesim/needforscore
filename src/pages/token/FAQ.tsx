import TokenLayout from "@/components/token/TokenLayout";
import { GlassCard, GradientHeading, Disclaimer } from "@/components/token/TokenUI";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const QA = [
  {
    q: "What is NeedForScore?",
    a: "A community-run reputation network. You can search any Instagram, X, TikTok handle, or phone number and read what real people experienced with that identity — plus a 1–10 trust score.",
  },
  {
    q: "Why is NeedForScore needed?",
    a: "Global online fraud losses have crossed $1 trillion. Instagram is the most-abused platform for fake clinics and impersonation, and phone fraud is the #1 scam category in emerging markets. Victims currently have no way to warn the next person. NeedForScore closes that gap.",
  },
  {
    q: "How is a trust score calculated?",
    a: "Users share an experience and rate the identity 1–10 in under 30 seconds. Ratings are weighted by each rater's own $SCORE, filtered through moderation, and passed through time-decay and evidence multipliers so the score stays manipulation-resistant.",
  },
  {
    q: "Which identities can I look up?",
    a: "Instagram, X (Twitter), TikTok, phone numbers with country codes, and $SCORE user profiles.",
  },
  {
    q: "How is this different from Google Reviews or Trustpilot?",
    a: "Google Reviews and Trustpilot are business-only. You can't search an Instagram handle or a phone number there. NeedForScore is individual-first: it builds reputation on the identities you actually interact with online.",
  },
  {
    q: "Why can't I just trust social platforms to warn me?",
    a: "Social platforms are content-focused and have zero incentive to surface negative signal on their own users. NeedForScore is neutral and community-owned, so bad actors can't hide behind a platform's PR.",
  },
  {
    q: "Is $SCORE ownership of NeedForScore?",
    a: "No. $SCORE does not represent equity, ownership, dividends, or governance over the platform. It exists to coordinate a worldwide community around the mission.",
  },
  {
    q: "Do I need $SCORE to use the app?",
    a: "No. Searching, reading, and rating are free. $SCORE powers rewards, coordination, and the trust graph — it never buys a better reputation.",
  },
  {
    q: "Why is 95% of $SCORE allocated to the community?",
    a: "Because $SCORE's purpose is community growth. Concentrating supply in the community keeps the token aligned with the mission and prevents insider dumps.",
  },
  {
    q: "What is the 5% development allocation used for?",
    a: "Platform development, infrastructure, security, moderation, and global growth. Nothing else.",
  },
  {
    q: "Does buying $SCORE affect my Trust Score?",
    a: "No. Reputation and Trust Score on NeedForScore are based on real user experiences and community input — never on token holdings.",
  },
  {
    q: "How do you protect privacy?",
    a: "Phone numbers are masked everywhere they appear publicly (e.g. +90 532 *** ** 67). Phone pages are excluded from search engines. Full detail is only shown to a user who intentionally searches that exact number.",
  },
  {
    q: "How do you prevent defamation and abuse?",
    a: "Rate limits, evidence-based moderation, community voting, time-decay, and rater-weighted scoring stop abuse before it spreads. Content can be moderated or removed if it violates policy.",
  },
  {
    q: "Can I rate someone anonymously?",
    a: "No pseudonym-only accounts. Every rater has a $SCORE profile so the trust graph stays legitimate and manipulation is expensive.",
  },
  {
    q: "Is participation in $SCORE risky?",
    a: "Yes. Any participation in a token carries risk. Please do your own research, only participate with what you can afford to lose, and read the disclaimer.",
  },
  {
    q: "Where can I read the details?",
    a: "The Whitepaper, Tokenomics, and Roadmap pages contain the full explanation.",
  },
];

const FAQ = () => (
  <TokenLayout
    title="FAQ — NeedForScore & $SCORE"
    description="Frequently asked questions about NeedForScore and $SCORE: how the trust score works, privacy, tokenomics, moderation, and how to participate."
    canonical="/community-token/faq"
  >
    <GradientHeading>FAQ</GradientHeading>
    <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
      Straight answers about NeedForScore and{" "}
      <span className="font-extrabold text-emerald-300">$SCORE</span>.
    </p>

    <GlassCard className="mt-8">
      <Accordion type="single" collapsible className="w-full">
        {QA.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-emerald-500/15">
            <AccordionTrigger className="text-left font-semibold hover:text-emerald-300">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </GlassCard>

    <Disclaimer />
  </TokenLayout>
);

export default FAQ;
