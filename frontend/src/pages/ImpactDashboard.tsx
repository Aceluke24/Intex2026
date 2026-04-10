import { PublicLayout } from "@/components/PublicLayout";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCount } from "@/components/AnimatedCount";
import {
  fetchPublicImpactBundle,
  fetchPublicHomeStats,
  filterValidPublicCampaigns,
  type PublicImpactBundle,
  type PublicHomeStats,
} from "@/lib/publicImpact";

const LazyImpactCampaignsSection = lazy(async () => {
  const module = await import("@/components/impact/ImpactCampaignsSection");
  return { default: module.ImpactCampaignsSection };
});

function toFiniteNumberOrZero(value: unknown): number {
  if (typeof value !== "number") return 0;
  if (!Number.isFinite(value)) return 0;
  return value;
}

const ImpactDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [data, setData] = useState<PublicImpactBundle | null>(null);
  const [homeStats, setHomeStats] = useState<PublicHomeStats | null>(null);
  const [animateCampaignBars, setAnimateCampaignBars] = useState(false);

  const validCampaigns = useMemo(
    () => (data?.campaigns ? filterValidPublicCampaigns(data.campaigns) : []),
    [data?.campaigns],
  );

  const headlineStats = useMemo(() => {
    const totalRaised =
      validCampaigns.length > 0
        ? validCampaigns.reduce((s, c) => s + Number(c.raised || 0), 0)
        : data?.summary.totalDonations != null
          ? Number(data.summary.totalDonations)
          : null;
    const livesImpacted = data?.summary.survivors ?? homeStats?.totalResidents ?? null;
    const activeResidents = homeStats?.activeResidents ?? null;
    return { totalRaised, livesImpacted, activeResidents };
  }, [validCampaigns, data, homeStats]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
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
      } catch (error) {
        console.error("Impact dashboard load failed:", error);
        setLoadError("Live impact data is unavailable right now. Showing placeholders.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setAnimateCampaignBars(false);
    const timer = window.setTimeout(() => setAnimateCampaignBars(true), 80);
    return () => window.clearTimeout(timer);
  }, [validCampaigns.length]);

  return (
    <PublicLayout overlayHeader>
      <section className="relative overflow-hidden gradient-hero text-navy-foreground">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.18), transparent 40%), radial-gradient(circle at 80% 70%, rgba(239,125,92,0.22), transparent 45%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl space-y-12 px-6 pb-20 pt-28 sm:pt-32 lg:px-12 lg:pt-36">
          {loadError && (
            <div
              className="rounded-xl border border-navy-foreground/25 bg-navy-foreground/10 px-4 py-3 font-body text-sm text-navy-foreground/90"
              role="alert"
            >
              {loadError}
            </div>
          )}
          <header className="space-y-6 text-left">
            <p className="font-body text-[11px] font-medium uppercase tracking-[0.24em] text-terracotta">Impact</p>
            <h1 className="max-w-4xl font-display text-5xl font-semibold leading-[1.04] tracking-tight md:text-6xl">
              Programs and measurable outcomes
            </h1>
            <p className="max-w-2xl font-body text-lg leading-relaxed text-navy-foreground/70">
              This page highlights current program areas, outcomes, and campaign momentum using available public data.
            </p>
          </header>

          <div className="flex flex-col gap-8 border-t border-navy-foreground/15 pt-10 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-12 sm:gap-y-6">
            {(
              [
                {
                  label: "Total raised",
                  value: toFiniteNumberOrZero(headlineStats.totalRaised),
                  prefix: "$",
                },
                {
                  label: "Active Residents",
                  value: toFiniteNumberOrZero(headlineStats.activeResidents),
                  title: "Residents currently marked active in the care system",
                },
                {
                  label: "Lives impacted",
                  value: toFiniteNumberOrZero(headlineStats.livesImpacted),
                },
              ] as const
            ).map((item, i) => (
              <div
                key={item.label}
                className={`min-w-[10rem] flex-1 sm:flex-initial ${i > 0 ? "sm:border-l sm:border-navy-foreground/15 sm:pl-12" : ""}`}
              >
                <p
                  className="font-body text-[11px] font-medium uppercase tracking-[0.2em] text-navy-foreground/55"
                  title={item.title}
                >
                  {item.label}
                </p>
                <p className="mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">
                  {loading ? (
                    <Skeleton className="h-10 w-28 rounded-md bg-navy-foreground/15" />
                  ) : (
                    <AnimatedCount value={item.value} prefix={"prefix" in item ? item.prefix : ""} fallback="0" />
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-background text-foreground">
        <section className="border-t border-border">
          <div className="mx-auto max-w-7xl space-y-12 px-6 py-20 lg:px-12">
            <header className="space-y-4 text-left">
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Programs</h2>
              <p className="max-w-2xl font-body text-lg leading-relaxed text-muted-foreground">
                Core pillars of care across safe housing, education, counseling, and reintegration.
              </p>
            </header>
            <div className="space-y-0">
              {[
                {
                  title: "Safe Housing",
                  description: "Secure, confidential homes with immediate and ongoing care.",
                  metric:
                    data?.outcomes.safeHousing !== null && data?.outcomes.safeHousing !== undefined
                      ? `${Math.round(data.outcomes.safeHousing)}%`
                      : "—",
                  metricLabel: "Outcome score",
                },
                {
                  title: "Education",
                  description: "Formal and non-formal education with life-skills support.",
                  metric:
                    data?.outcomes.education !== null && data?.outcomes.education !== undefined
                      ? `${Math.round(data.outcomes.education)}%`
                      : "—",
                  metricLabel: "In education",
                },
                {
                  title: "Counseling",
                  description: "Trauma-informed counseling delivered through local care teams.",
                  metric:
                    data?.outcomes.counseling !== null && data?.outcomes.counseling !== undefined
                      ? `${Math.round(data.outcomes.counseling)}%`
                      : "—",
                  metricLabel: "Counseling coverage",
                },
                {
                  title: "Reintegration",
                  description: "Case planning and long-term support from intake to independence.",
                  metric:
                    data?.outcomes.interventionPlans !== null && data?.outcomes.interventionPlans !== undefined
                      ? `${Math.round(data.outcomes.interventionPlans)}%`
                      : "—",
                  metricLabel: "Reintegration planning",
                },
              ].map((program) => (
                <div key={program.title} className="space-y-3 border-b border-border py-8 last:border-b-0">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-baseline">
                    <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">{program.title}</h3>
                    <p className="shrink-0 font-body text-sm tabular-nums text-terracotta">
                      {program.metric}{" "}
                      <span className="text-muted-foreground">{program.metricLabel}</span>
                    </p>
                  </div>
                  <p className="max-w-3xl font-body text-sm leading-relaxed text-muted-foreground">{program.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto max-w-7xl space-y-12 px-6 py-20 lg:px-12">
            <header className="space-y-4 text-left">
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Outcomes</h2>
              <p className="max-w-2xl font-body text-lg leading-relaxed text-muted-foreground">
                Snapshot metrics from our programs and records.
              </p>
            </header>
            <div className="grid gap-10 sm:grid-cols-3 sm:gap-0">
              {[
                {
                  node: (
                    <>
                      <p className="font-display text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">
                        <AnimatedCount value={homeStats?.counselingSessionsCount ?? null} fallback="—" />
                      </p>
                      <p className="mt-2 font-body text-sm text-muted-foreground">Counseling sessions delivered</p>
                    </>
                  ),
                },
                {
                  node: (
                    <>
                      <p className="font-display text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">
                        <AnimatedCount value={data?.outcomes.education ?? null} suffix="%" fallback="—" />
                      </p>
                      <p className="mt-2 font-body text-sm text-muted-foreground">In education</p>
                    </>
                  ),
                },
                {
                  node: (
                    <>
                      <p className="font-display text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">
                        <AnimatedCount value={homeStats?.reintegrationRatePercent ?? null} suffix="%" fallback="—" />
                      </p>
                      <p className="mt-2 font-body text-sm text-muted-foreground">Reintegration rate</p>
                    </>
                  ),
                },
              ].map((col, idx) => (
                <div key={idx} className={`sm:px-8 ${idx > 0 ? "sm:border-l sm:border-border" : ""}`}>
                  {col.node}
                </div>
              ))}
            </div>
            <p className="max-w-3xl font-body text-xs leading-relaxed text-muted-foreground">
              Counseling session total is the count of process recordings in the database. Reintegration rate is completed
              reintegrations divided by total residents.
            </p>
          </div>
        </section>

        <Suspense
          fallback={
            <section className="border-t border-border">
              <div className="mx-auto max-w-7xl space-y-6 px-6 py-20 lg:px-12">
                <Skeleton className="h-8 w-48 rounded-md" />
                <Skeleton className="h-56 w-full rounded-lg" />
              </div>
            </section>
          }
        >
          <LazyImpactCampaignsSection campaigns={validCampaigns} animateBars={animateCampaignBars} />
        </Suspense>

        <section className="border-t border-border">
          <div className="mx-auto max-w-7xl space-y-12 px-6 py-20 lg:px-12">
            <header className="space-y-4 text-left">
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Allocation snapshot</h2>
              <p className="max-w-2xl font-body text-lg leading-relaxed text-muted-foreground">
                How resources are directed across services and operations.
              </p>
            </header>
            <div className="grid gap-10 sm:grid-cols-3 sm:gap-0">
              {[
                { label: "Direct Services", value: data?.allocation.direct ?? null },
                { label: "Outreach", value: data?.allocation.outreach ?? null },
                { label: "Operations", value: data?.allocation.operations ?? null },
              ].map((item, idx) => (
                <div key={item.label} className={`sm:px-8 ${idx > 0 ? "sm:border-l sm:border-border" : ""}`}>
                  <p className="font-display text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">
                    <AnimatedCount value={item.value} suffix="%" fallback="—" />
                  </p>
                  <p className="mt-2 font-body text-sm text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="font-body text-xs text-muted-foreground">
              Allocation values are shown with placeholders where live allocation endpoints are unavailable.
            </p>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default ImpactDashboard;
