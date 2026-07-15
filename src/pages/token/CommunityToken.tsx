import { Link } from "react-router-dom";
import { Sparkles, ShieldCheck, Users, ArrowRight } from "lucide-react";
import TokenLayout from "@/components/token/TokenLayout";
import { GlassCard, GradientHeading, Prose, Disclaimer } from "@/components/token/TokenUI";

const CommunityToken = () => {
  return (
    <TokenLayout
      title="Community Token — NeedForScore"
      description="The NeedForScore Community Token exists to grow a global community fighting online fraud and building digital trust."
      canonical="/community-token"
    >
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          COMMUNITY-FIRST · MISSION-DRIVEN
        </div>
        <GradientHeading>The NeedForScore Community Token</GradientHeading>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
          A token built to unite a global community around a single mission: reduce online scams and increase trust
          on the internet. The product always comes first — the token exists to support community growth.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link
            to="/community-token/why"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-background bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_30px_rgba(16,185,129,0.45)] hover:shadow-[0_0_40px_rgba(16,185,129,0.7)] transition-all"
          >
            Learn More <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/community-token/whitepaper"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold border border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/10 transition-colors"
          >
            Read Whitepaper
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-10">
        {[
          { icon: ShieldCheck, title: "Trust-first", body: "Reputation and safety come before speculation." },
          { icon: Users, title: "Community-owned", body: "95% of supply belongs to the community." },
          { icon: Sparkles, title: "Mission-aligned", body: "Powers global growth against online fraud." },
        ].map(({ icon: Icon, title, body }) => (
          <GlassCard key={title}>
            <Icon className="h-6 w-6 text-emerald-300 mb-3" />
            <div className="font-bold text-foreground mb-1">{title}</div>
            <div className="text-sm text-muted-foreground">{body}</div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <Prose>
          <p>
            NeedForScore is a digital reputation platform helping people identify scams and evaluate the trustworthiness
            of accounts and phone numbers they encounter online. The Community Token is not the product — it is a
            coordination layer designed to grow a worldwide community around this mission.
          </p>
          <p>
            Every decision we make prioritizes the platform's usefulness, safety, and long-term integrity. The token
            exists only to support that mission.
          </p>
        </Prose>
      </GlassCard>

      <Disclaimer />
    </TokenLayout>
  );
};

export default CommunityToken;
