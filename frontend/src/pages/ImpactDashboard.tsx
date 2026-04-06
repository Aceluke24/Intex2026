import { PublicLayout } from "@/components/PublicLayout";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { SkeletonCard, SkeletonChart } from "@/components/SkeletonLoaders";
import { delay, monthlyDonations, campaigns, programOutcomes, impactStats } from "@/lib/mockData";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

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

const ImpactDashboard = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => { delay(1000).then(() => setLoading(false)); }, []);

  if (loading) {
    return (
      <PublicLayout>
        <div className="pt-28 pb-20 max-w-6xl mx-auto px-6 space-y-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[1,2,3,4].map(i => <SkeletonCard key={i} className="border-0 bg-transparent" />)}
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
              { label: "Lives Changed", value: impactStats.survivorsHelped.toLocaleString() + "+", context: "survivors helped since 2018" },
              { label: "Total Raised", value: "$" + (impactStats.donationsTotal / 1e6).toFixed(1) + "M", context: "from 4,200+ donors worldwide" },
              { label: "Programs", value: impactStats.programsActive.toString(), context: "active support programs" },
              { label: "Success Rate", value: impactStats.successRate + "%", context: "program completion rate" },
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
                Monthly donations have increased 45% year-over-year, allowing us to expand into 12 new communities.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="bg-card rounded-3xl p-6 lg:p-10">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyDonations}>
                  <defs>
                    <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(10,55%,65%)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(10,55%,65%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(213,15%,45%)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(213,15%,45%)" }} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Donations"]} />
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
            {programOutcomes.map((p, i) => (
              <Reveal key={p.program} delay={i * 0.06}>
                <div className="flex items-center gap-6">
                  <p className="font-body text-sm text-foreground w-28 flex-shrink-0 text-right">{p.program}</p>
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

          <div className="space-y-10">
            {campaigns.map((c, i) => {
              const pct = Math.round((c.raised / c.goal) * 100);
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
                      <p className="font-body text-sm text-foreground font-medium">${(c.raised / 1000).toFixed(0)}k raised</p>
                      <p className="font-body text-sm text-muted-foreground">${(c.goal / 1000).toFixed(0)}k goal</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Your Dollar at Work */}
      <section className="py-28 lg:py-36">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <div className="gradient-navy-deep rounded-3xl p-10 lg:p-16">
              <p className="font-body text-[11px] font-medium uppercase tracking-[0.3em] text-terracotta mb-4">Your dollar at work</p>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-navy-foreground mb-12 leading-tight max-w-md">
                Every $100 donated is distributed with intention.
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
                {[
                  { amt: "$82", label: "Direct Services", desc: "Housing, counseling, legal aid" },
                  { amt: "$8", label: "Training", desc: "Staff development" },
                  { amt: "$7", label: "Outreach", desc: "Donor stewardship" },
                  { amt: "$3", label: "Operations", desc: "Essential admin" },
                ].map((item, i) => (
                  <Reveal key={item.label} delay={i * 0.1}>
                    <div>
                      <p className="font-display text-3xl lg:text-4xl font-bold text-terracotta leading-none mb-2">{item.amt}</p>
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
