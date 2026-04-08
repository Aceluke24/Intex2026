import { PublicLayout } from "@/components/PublicLayout";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { SkeletonCard, SkeletonChart } from "@/components/SkeletonLoaders";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { API_BASE } from "@/lib/apiBase";

const Reveal = ({ children, className = "", delay: d = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 35 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.8, delay: d, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const MONTH_SHORT = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type ImpactSummary = {
  survivors: number;
  totalDonations: number;
  activePrograms: number;
  completionRate: number;
};

type TrendRow = { year: number; month: number; total: number };

type ProgramOutcomes = {
  safeHousing: number;
  education: number;
  counseling: number;
  interventionPlans: number;
};

type CampaignRow = {
  name: string;
  raised: number;
  goal: number;
  daysLeft: number;
};

type AllocationBreakdown = {
  direct: number;
  outreach: number;
  operations: number;
};

const ImpactDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImpactSummary>({
    survivors: 0,
    totalDonations: 0,
    activePrograms: 0,
    completionRate: 0,
  });
  const [trend, setTrend] = useState<TrendRow[]>([]);
  const [outcomes, setOutcomes] = useState<ProgramOutcomes>({
    safeHousing: 0,
    education: 0,
    counseling: 0,
    interventionPlans: 0,
  });
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [allocation, setAllocation] = useState<AllocationBreakdown>({
    direct: 0,
    outreach: 0,
    operations: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoadError(null);
        const [sRes, tRes, oRes, cRes, aRes] = await Promise.all([
          fetch(`${API_BASE}/api/public/impact/summary`),
          fetch(`${API_BASE}/api/public/impact/donations-trend`),
          fetch(`${API_BASE}/api/public/impact/program-outcomes`),
          fetch(`${API_BASE}/api/public/impact/campaigns`),
          fetch(`${API_BASE}/api/public/impact/allocation`),
        ]);

        const failed = [sRes, tRes, oRes, cRes, aRes].find((r) => !r.ok);
        if (failed) {
          throw new Error(`Impact API request failed with status ${failed.status}`);
        }

        const sJson = await sRes.json().catch(() => ({}));
        setSummary({
          survivors: typeof sJson.survivors === "number" ? sJson.survivors : 0,
          totalDonations: typeof sJson.totalDonations === "number" ? sJson.totalDonations : 0,
          activePrograms: typeof sJson.activePrograms === "number" ? sJson.activePrograms : 0,
          completionRate: typeof sJson.completionRate === "number" ? sJson.completionRate : 0,
        });

        const tJson = await tRes.json().catch(() => []);
        setTrend(Array.isArray(tJson) ? tJson : []);

        const oJson = await oRes.json().catch(() => ({}));
        setOutcomes({
          safeHousing: typeof oJson.safeHousing === "number" ? oJson.safeHousing : 0,
          education: typeof oJson.education === "number" ? oJson.education : 0,
          counseling: typeof oJson.counseling === "number" ? oJson.counseling : 0,
          interventionPlans: typeof oJson.interventionPlans === "number" ? oJson.interventionPlans : 0,
        });

        const cJson = await cRes.json().catch(() => []);
        setCampaigns(Array.isArray(cJson) ? cJson : []);

        const aJson = await aRes.json().catch(() => ({}));
        setAllocation({
          direct: typeof aJson.direct === "number" ? aJson.direct : 0,
          outreach: typeof aJson.outreach === "number" ? aJson.outreach : 0,
          operations: typeof aJson.operations === "number" ? aJson.operations : 0,
        });
      } catch (err) {
        console.error("[ImpactDashboard]", err);
        setLoadError("Live impact data is unavailable right now. Please try again shortly.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const chartData = useMemo(() => {
    return trend.map((row) => ({
      month: `${MONTH_SHORT[row.month] ?? "?"} ${row.year}`,
      amount: Number(row.total) || 0,
    }));
  }, [trend]);

  const programRows = useMemo(
    () => [
      { program: "Safe Housing", rate: Math.min(100, Math.max(0, Math.round(outcomes.safeHousing))) },
      { program: "Education", rate: Math.min(100, Math.max(0, Math.round(outcomes.education))) },
      { program: "Counseling", rate: Math.min(100, Math.max(0, Math.round(outcomes.counseling))) },
      { program: "Intervention plans", rate: Math.min(100, Math.max(0, Math.round(outcomes.interventionPlans))) },
    ],
    [outcomes]
  );

  const totalRaisedM = (summary.totalDonations / 1_000_000).toFixed(1);

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
      {/* Hero intro */}
      <section className="pt-32 lg:pt-44 pb-20 gradient-cream-warm">
        <div className="max-w-5xl mx-auto px-6">
          {loadError && (
            <div className="mb-6 rounded-xl border border-terracotta/35 bg-terracotta/10 px-4 py-3 text-sm font-body text-foreground" role="alert">
              {loadError}
            </div>
          )}
          <Reveal>
            <p className="font-body text-[11px] font-medium uppercase tracking-[0.3em] text-terracotta mb-6">
              Transparency report
            </p>
            <h1 className="font-display text-[clamp(2rem,5vw,4rem)] font-bold text-foreground leading-[1.1] mb-6 max-w-2xl">
              See exactly how your <span className="italic text-terracotta">generosity</span> creates change.
            </h1>
            <p className="font-body text-base text-muted-foreground max-w-lg leading-relaxed">
              We believe in radical transparency. Every number here represents a real person whose life
              was transformed by your support.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Key numbers — editorial, no boxes */}
      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-16 gap-x-12">
            {[
              { label: "Lives Changed", value: summary.survivors.toLocaleString() + "+", context: "Residents in our records" },
              { label: "Total Raised", value: "$" + totalRaisedM + "M", context: "Monetary donations on file" },
              { label: "Programs", value: summary.activePrograms.toString(), context: "Distinct partner program areas" },
              { label: "Success Rate", value: summary.completionRate + "%", context: "Education records completed" },
            ].map((m, i) => (
              <Reveal key={m.label} delay={i * 0.08}>
                <div>
                  <p className="font-display text-4xl lg:text-5xl font-bold text-foreground leading-none mb-2">{m.value}</p>
                  <p className="font-body text-xs text-muted-foreground">{m.context}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Donation trend — narrative framing */}
      <section className="py-20 gradient-section-blush">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <div className="lg:flex items-end justify-between gap-12 mb-12">
              <div>
                <p className="font-body text-[11px] font-medium uppercase tracking-[0.3em] text-terracotta mb-3">Giving trends</p>
                <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground leading-tight max-w-md">
                  Your generosity is growing — and so is our impact.
                </h2>
              </div>
              <p className="font-body text-sm text-muted-foreground max-w-xs mt-4 lg:mt-0 leading-relaxed">
                Monthly totals reflect recorded donations grouped by calendar month.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="bg-card rounded-3xl p-6 lg:p-10">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(10,55%,65%)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(10,55%,65%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(213,15%,45%)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(213,15%,45%)" }} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => [`$${Number(v).toLocaleString()}`, "Donations"]} />
                  <Area type="monotone" dataKey="amount" stroke="hsl(10,55%,65%)" strokeWidth={2.5} fill="url(#impGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Program outcomes — horizontal bars with narrative */}
      <section className="py-24 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <p className="font-body text-[11px] font-medium uppercase tracking-[0.3em] text-terracotta mb-3">Program outcomes</p>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-16 max-w-lg leading-tight">
              Real results across every program we offer.
            </h2>
          </Reveal>

          <div className="space-y-8">
            {programRows.map((p, i) => (
              <Reveal key={p.program} delay={i * 0.06}>
                <div className="flex items-center gap-6">
                  <p className="font-body text-sm text-foreground w-36 flex-shrink-0 text-right">{p.program}</p>
                  <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${p.rate}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-terracotta"
                    />
                  </div>
                  <p className="font-display text-lg font-bold text-foreground w-14">{p.rate}%</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Active campaigns */}
      <section className="py-24 gradient-cream-warm">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <p className="font-body text-[11px] font-medium uppercase tracking-[0.3em] text-terracotta mb-3">Active campaigns</p>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-16 leading-tight">
              Help us reach these goals.
            </h2>
          </Reveal>

          {campaigns.length === 0 ? (
            <Reveal>
              <p className="font-body text-sm text-muted-foreground">No campaign-tagged donations yet.</p>
            </Reveal>
          ) : (
            <div className="space-y-10">
              {campaigns.map((c, i) => {
                const goal = Number(c.goal) || 0;
                const raised = Number(c.raised) || 0;
                const pct = goal > 0 ? Math.round((raised / goal) * 100) : 0;
                return (
                  <Reveal key={c.name} delay={i * 0.1}>
                    <div>
                      <div className="flex items-end justify-between mb-3">
                        <h3 className="font-display text-lg font-semibold text-foreground">{c.name}</h3>
                        <p className="font-body text-xs text-muted-foreground">{c.daysLeft} days left</p>
                      </div>
                      <div className="h-2.5 bg-secondary rounded-full overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full rounded-full bg-terracotta"
                        />
                      </div>
                      <div className="flex justify-between">
                        <p className="font-body text-sm text-foreground font-medium">${raised.toLocaleString()} raised</p>
                        <p className="font-body text-sm text-muted-foreground">${goal.toLocaleString()} goal</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Your Dollar at Work */}
      <section className="py-28 lg:py-36">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <div className="gradient-navy-deep rounded-3xl p-10 lg:p-16">
              <p className="font-body text-[11px] font-medium uppercase tracking-[0.3em] text-terracotta mb-4">Your dollar at work</p>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-navy-foreground mb-12 leading-tight max-w-md">
                How recorded allocations compare across program areas.
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
                {[
                  { pct: allocation.direct, label: "Direct services", desc: "Education and wellbeing allocations" },
                  { pct: allocation.outreach, label: "Outreach", desc: "Community outreach allocations" },
                  { pct: allocation.operations, label: "Operations", desc: "Operations allocations" },
                ].map((item, i) => (
                  <Reveal key={item.label} delay={i * 0.1}>
                    <div>
                      <p className="font-display text-3xl lg:text-4xl font-bold text-terracotta leading-none mb-2">{item.pct}%</p>
                      <p className="font-body text-sm font-medium text-navy-foreground mb-0.5">{item.label}</p>
                      <p className="font-body text-xs text-navy-foreground/40">{item.desc}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PublicLayout>
  );
};

export default ImpactDashboard;
