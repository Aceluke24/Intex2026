import { PublicSafetyNote } from "@/components/PublicSafetyNote";
import { cn } from "@/lib/utils";
import { Heart, Shield, Sparkles, Sunrise } from "lucide-react";
import { useEffect, useState } from "react";

const CAMPAIGN_ICONS = [Sparkles, Heart, Shield, Sunrise] as const;

function iconForCampaignName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return CAMPAIGN_ICONS[h % CAMPAIGN_ICONS.length];
}

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

function ImpactCampaignPanel({
  campaign,
  animateBars,
  index,
  motionSafe,
}: {
  campaign: ImpactCampaignRow;
  animateBars: boolean;
  index: number;
  motionSafe: boolean;
}) {
  const raised = Number(campaign.raised || 0);
  const goal = Number(campaign.goal || 0);
  const progress = goal > 0 ? Math.min(raised / goal, 1) : 0;
  const percentage = Math.round(progress * 100);
  const Icon = iconForCampaignName(campaign.name);
  const widthPct = animateBars ? percentage : 0;

  return (
    <article
      className={cn(
        "group relative mb-8 last:mb-0 rounded-[1.35rem] border p-6 sm:p-7 md:p-8",
        "border-slate-200/70 bg-gradient-to-br from-white/90 via-white/70 to-[hsl(280_45%_96%/0.55)]",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.92),0_18px_50px_rgba(15,23,42,0.07)]",
        "backdrop-blur-xl transition-all duration-300 ease-out",
        "hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_24px_60px_rgba(15,23,42,0.11)]",
        "dark:border-white/[0.07] dark:from-white/[0.08] dark:via-white/[0.04] dark:to-[rgba(124,58,237,0.06)]",
        "dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.09),0_12px_44px_rgba(0,0,0,0.42)]",
        "dark:hover:border-white/[0.14] dark:hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_22px_56px_rgba(0,0,0,0.55)]",
        motionSafe && "opacity-0 animate-impact-fade-up",
      )}
      style={
        motionSafe
          ? {
              animationDelay: `${index * 75}ms`,
            }
          : undefined
      }
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-x-8">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-fuchsia-500/15 bg-gradient-to-br from-fuchsia-500/12 to-indigo-500/10 text-fuchsia-600/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35)] dark:border-white/10 dark:from-fuchsia-400/10 dark:to-indigo-500/15 dark:text-fuchsia-200/55"
            aria-hidden
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
          <h3 className="font-body text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-[1.125rem]">
            {campaign.name}
          </h3>
        </div>
        <p
          className="shrink-0 font-body text-sm font-medium tabular-nums tracking-tight text-muted-foreground/95 dark:text-slate-300/85 sm:pt-0.5 sm:text-right"
          title={`$${formatCurrency(raised)} raised of $${formatCurrency(goal)} goal`}
        >
          ${formatCurrency(raised)} <span className="text-muted-foreground/70">/</span> ${formatCurrency(goal)}
        </p>
      </div>

      <div className="mt-5">
        <div
          className="relative h-4 overflow-hidden rounded-full bg-slate-900/[0.07] ring-1 ring-inset ring-black/[0.04] dark:bg-white/[0.09] dark:ring-white/[0.06]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          aria-label={`${campaign.name}: ${percentage}% funded`}
        >
          <div
            className="absolute inset-y-0 left-0 overflow-hidden rounded-full"
            style={{
              width: `${widthPct}%`,
              transition: motionSafe ? "width 900ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            }}
          >
            <div className="h-full w-full rounded-full bg-gradient-to-r from-[#ff6b9a] via-[#c084fc] to-[#7c8cff] shadow-[0_0_22px_rgba(255,107,154,0.55),0_0_40px_rgba(124,140,255,0.35)] transition-[box-shadow] duration-300 group-hover:shadow-[0_0_30px_rgba(255,107,154,0.75),0_0_52px_rgba(124,140,255,0.48)]" />
            {motionSafe && (
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
                aria-hidden
              >
                <div className="absolute inset-y-0 w-1/2 animate-impact-shimmer bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-90" />
              </div>
            )}
          </div>
        </div>
        <p className="mt-3 text-[0.8125rem] font-medium tabular-nums tracking-wide text-foreground/88 dark:text-slate-200/90">
          {percentage}% funded
        </p>
      </div>
    </article>
  );
}

export function ImpactCampaignsSection({ campaigns, animateBars }: ImpactCampaignsSectionProps) {
  const motionSafe = !usePrefersReducedMotion();

  return (
    <section className="relative overflow-hidden py-20 md:py-24 lg:py-28">
      <div
        className="absolute inset-0 bg-gradient-to-b from-[hsl(280_38%_97%)] via-[hsl(36_32%_95%)] to-[hsl(213_28%_93%)] dark:from-[hsl(222_48%_7%)] dark:via-[hsl(262_38%_11%)] dark:to-[hsl(222_50%_5%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -right-24 -top-28 h-[min(520px,90vw)] w-[min(520px,90vw)] rounded-full bg-fuchsia-400/28 blur-[110px] dark:bg-fuchsia-500/14" />
        <div className="absolute -bottom-36 -left-28 h-[460px] w-[460px] rounded-full bg-violet-500/22 blur-[110px] dark:bg-violet-600/16" />
        <div className="absolute left-1/2 top-[42%] h-[280px] w-[min(900px,120%)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-400/14 blur-[100px] dark:bg-pink-500/10" />
        <div className="absolute bottom-0 right-1/4 h-[200px] w-[320px] rounded-full bg-indigo-400/12 blur-[90px] dark:bg-indigo-500/12" />
      </div>

      <div className="relative z-10 mx-auto max-w-[900px] px-6">
        <header className="mb-12 md:mb-14 lg:mb-16">
          <h2 className="font-display text-[clamp(2rem,4.5vw,2.75rem)] font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-[#db2777] via-[#a855f7] to-[#6366f1] bg-clip-text text-transparent dark:from-[#fda4c7] dark:via-[#d8b4fe] dark:to-[#a5b4fc]">
              Our Impact
            </span>
          </h2>
          <p className="mt-5 max-w-[36rem] font-body text-base leading-relaxed text-muted-foreground dark:text-slate-300/90">
            Transparent progress on the initiatives your support makes possible.
          </p>
        </header>

        {campaigns.length === 0 ? (
          <div
            className={cn(
              "rounded-[1.35rem] border border-slate-200/70 bg-gradient-to-br from-white/90 via-white/65 to-[hsl(280_40%_97%/0.6)] p-8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] backdrop-blur-xl dark:border-white/[0.07] dark:from-white/[0.06] dark:via-white/[0.03] dark:to-[rgba(124,58,237,0.05)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)]",
            )}
          >
            <p className="m-0 font-body text-sm text-muted-foreground">
              No campaign-tagged data is available yet.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {campaigns.map((campaign, index) => (
              <ImpactCampaignPanel
                key={campaign.name}
                campaign={campaign}
                animateBars={animateBars}
                index={index}
                motionSafe={motionSafe}
              />
            ))}
          </div>
        )}

        <PublicSafetyNote className="mt-12 text-muted-foreground dark:text-slate-400/90" />
      </div>
    </section>
  );
}
