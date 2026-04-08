import { PublicLayout } from "@/components/PublicLayout";
import { useState, useEffect } from "react";
import { SkeletonCard, SkeletonChart } from "@/components/SkeletonLoaders";
import { PublicSafetyNote } from "@/components/PublicSafetyNote";
import { AnimatedCount } from "@/components/AnimatedCount";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import {
  fetchPublicImpactBundle,
  fetchPublicHomeStats,
  type PublicImpactBundle,
  type PublicHomeStats,
} from "@/lib/publicImpact";

const ImpactDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [data, setData] = useState<PublicImpactBundle | null>(null);
  const [homeStats, setHomeStats] = useState<PublicHomeStats | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadError(null);
      const [bundle, stats] = await Promise.all([fetchPublicImpactBundle(), fetchPublicHomeStats()]);
      setData(bundle);
      setHomeStats(stats);
      const homeEmpty =
        stats.totalResidents == null &&
        stats.totalSafehouses == null &&
        stats.counselingSessionsCount == null &&
        stats.reintegrationRatePercent == null;
      if (!bundle.summary.survivors && !bundle.summary.totalDonations && homeEmpty) {
        setLoadError("Live impact data is unavailable right now. Showing placeholders.");
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <PublicLayout>
        <div className="pt-28 pb-20 max-w-6xl mx-auto px-6 space-y-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} className="border-0 bg-transparent" />
            ))}
          </div>
          <SkeletonChart className="border-0" />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="pt-28 pb-16 sm:pt-32 lg:pt-36 gradient-cream-warm">
        <div className="max-w-5xl mx-auto px-6">
          {loadError && (
            <div className="mb-6 rounded-xl border border-terracotta/35 bg-terracotta/10 px-4 py-3 text-sm font-body text-foreground" role="alert">
              {loadError}
            </div>
          )}
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-terracotta mb-4">Impact</p>
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-semibold tracking-tight text-foreground leading-[1.12] mb-5">
            Programs and measurable outcomes
          </h1>
          <p className="text-muted-foreground max-w-3xl leading-relaxed">
            This page highlights current program areas, outcomes, and campaign momentum using available public data.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-foreground mb-6">Programs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Safe Housing",
                description: "Secure, confidential homes with immediate and ongoing care.",
                metric: data?.outcomes.safeHousing !== null && data?.outcomes.safeHousing !== undefined ? `${Math.round(data.outcomes.safeHousing)}%` : "--",
                metricLabel: "Outcome score",
              },
              {
                title: "Education",
                description: "Formal and non-formal education with life-skills support.",
                metric: data?.outcomes.education !== null && data?.outcomes.education !== undefined ? `${Math.round(data.outcomes.education)}%` : "--",
                metricLabel: "In education",
              },
              {
                title: "Counseling",
                description: "Trauma-informed counseling delivered through local care teams.",
                metric: data?.outcomes.counseling !== null && data?.outcomes.counseling !== undefined ? `${Math.round(data.outcomes.counseling)}%` : "--",
                metricLabel: "Counseling coverage",
              },
              {
                title: "Reintegration",
                description: "Case planning and long-term support from intake to independence.",
                metric: data?.outcomes.interventionPlans !== null && data?.outcomes.interventionPlans !== undefined ? `${Math.round(data.outcomes.interventionPlans)}%` : "--",
                metricLabel: "Reintegration planning",
              },
            ].map((program) => (
              <RevealOnScroll key={program.title}>
              <article className="rounded-xl bg-muted/40 p-6 transition-all duration-300 ease-out hover:-translate-y-1">
                <h3 className="font-semibold text-foreground mb-2">{program.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{program.description}</p>
                <p className="text-xs text-terracotta">{program.metric} {program.metricLabel}</p>
              </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-foreground mb-6">Outcomes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3">
              <p className="font-display text-4xl font-semibold tracking-tight text-foreground">
                <AnimatedCount value={homeStats?.counselingSessionsCount ?? null} fallback="--" />
              </p>
              <p className="text-sm text-muted-foreground">Counseling sessions delivered</p>
            </div>
            <div className="p-3">
              <p className="font-display text-4xl font-semibold tracking-tight text-foreground">
                <AnimatedCount value={data?.outcomes.education ?? null} suffix="%" fallback="--" />
              </p>
              <p className="text-sm text-muted-foreground">% in education</p>
            </div>
            <div className="p-3">
              <p className="font-display text-4xl font-semibold tracking-tight text-foreground">
                <AnimatedCount value={homeStats?.reintegrationRatePercent ?? null} suffix="%" fallback="--" />
              </p>
              <p className="text-sm text-muted-foreground">Reintegration rate</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Counseling session total is the count of process recordings in the database. Reintegration rate is completed reintegrations divided by total residents.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-foreground mb-6">Campaign Effectiveness</h2>
          <div className="rounded-xl bg-muted/40 p-6">
            <p className="text-sm text-muted-foreground mb-4">
              This section is structured for campaign performance tracking and can be expanded with conversion and retention metrics as data endpoints grow.
            </p>
            {data?.campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No campaign-tagged data is available yet.</p>
            ) : (
              <div className="space-y-4">
                {data?.campaigns.map((campaign) => (
                  <div key={campaign.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl bg-background/80 px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ${Number(campaign.raised || 0).toLocaleString()} raised of ${Number(campaign.goal || 0).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <PublicSafetyNote className="mt-5" />
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-foreground mb-6">Allocation Snapshot</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Direct Services", value: data?.allocation.direct ?? null },
              { label: "Outreach", value: data?.allocation.outreach ?? null },
              { label: "Operations", value: data?.allocation.operations ?? null },
            ].map((item) => (
              <div key={item.label} className="p-3">
                <p className="font-display text-4xl font-semibold tracking-tight text-foreground">
                  <AnimatedCount value={item.value} suffix="%" fallback="--" />
                </p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Allocation values are shown with placeholders where live allocation endpoints are unavailable.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
};

export default ImpactDashboard;
