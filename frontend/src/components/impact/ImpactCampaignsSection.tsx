import { PublicSafetyNote } from "@/components/PublicSafetyNote";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export type ImpactCampaignRow = {
  name: string;
  raised: number;
  goal: number;
};

type ImpactCampaignsSectionProps = {
  campaigns: ImpactCampaignRow[];
  animateBars: boolean;
};

const formatCurrency = (value: number) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function ImpactCampaignRowView({
  campaign,
  animateBars,
  motionSafe,
}: {
  campaign: ImpactCampaignRow;
  animateBars: boolean;
  motionSafe: boolean;
}) {
  const raised = Number(campaign.raised || 0);
  const goal = Number(campaign.goal || 0);
  const progress = goal > 0 ? Math.min(raised / goal, 1) : 0;
  const percentage = Math.round(progress * 100);
  const widthPct = animateBars ? percentage : 0;

  return (
    <article className="space-y-3 border-b border-border py-8 last:border-b-0">
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 items-center gap-3">
          <Heart className="h-4 w-4 shrink-0 text-terracotta" strokeWidth={1.75} aria-hidden />
          <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-foreground">{campaign.name}</h3>
        </div>
        <p
          className="shrink-0 text-right font-body text-sm tabular-nums tracking-tight text-foreground"
          title={`$${formatCurrency(raised)} raised of $${formatCurrency(goal)} goal`}
        >
          ${formatCurrency(raised)} <span className="text-muted-foreground">/</span> ${formatCurrency(goal)}
        </p>
      </div>

      <div className={cn("space-y-2", motionSafe && "opacity-0 animate-impact-row-in")}>
        <div
          className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          aria-label={`${campaign.name}: ${percentage}% funded`}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-terracotta"
            style={{
              width: `${widthPct}%`,
              transition: motionSafe ? "width 900ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            }}
          />
        </div>
        <p className="text-right font-body text-xs tabular-nums text-muted-foreground">{percentage}%</p>
      </div>
    </article>
  );
}

export function ImpactCampaignsSection({ campaigns, animateBars }: ImpactCampaignsSectionProps) {
  const motionSafe = !usePrefersReducedMotion();

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl space-y-12 px-6 py-20 lg:px-12">
        <header className="space-y-4 text-left">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Our Impact</h2>
          <p className="max-w-2xl font-body text-lg leading-relaxed text-muted-foreground">
            Transparent progress on the initiatives your support makes possible.
          </p>
        </header>

        {campaigns.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">No campaign-tagged data is available yet.</p>
        ) : (
          <div className="space-y-0">
            {campaigns.map((campaign) => (
              <ImpactCampaignRowView
                key={campaign.name}
                campaign={campaign}
                animateBars={animateBars}
                motionSafe={motionSafe}
              />
            ))}
          </div>
        )}

        <PublicSafetyNote />
      </div>
    </section>
  );
}
