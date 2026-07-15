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
    q: "Is the Community Token ownership of NeedForScore?",
    a: "No. The token does not represent equity, ownership, dividends, or governance over the platform. It exists to help grow a worldwide community around the mission.",
  },
  {
    q: "Why is 95% allocated to the community?",
    a: "Because the token's purpose is community growth. Concentrating supply in the community makes the token align with its stated mission.",
  },
  {
    q: "What is the 5% development allocation used for?",
    a: "Platform development, infrastructure, security, team expansion, and global growth. Nothing else.",
  },
  {
    q: "Does buying the token affect my Trust Score?",
    a: "No. Reputation and Trust Score on NeedForScore are based on real user experiences and community input — not on token holdings.",
  },
  {
    q: "Is participation risky?",
    a: "Yes. Any participation in a token carries risk. Please do your own research, only participate with what you can afford to lose, and read the disclaimer.",
  },
  {
    q: "Where can I read the details?",
    a: "The Whitepaper, Tokenomics, and Roadmap pages contain the full explanation.",
  },
];

const FAQ = () => (
  <TokenLayout
    title="FAQ — NeedForScore Community Token"
    description="Frequently asked questions about the NeedForScore Community Token: purpose, tokenomics, risk, and how it relates to the platform."
    canonical="/community-token/faq"
  >
    <GradientHeading>FAQ</GradientHeading>
    <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
      Straight answers about the Community Token.
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
