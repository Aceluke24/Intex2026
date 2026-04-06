import { PublicLayout } from "@/components/PublicLayout";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { SkeletonCard, SkeletonChart } from "@/components/SkeletonLoaders";
import { delay, monthlyDonations, campaigns, programOutcomes, impactStats } from "@/lib/mockData";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const ImpactDashboard = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => { delay(1200).then(() => setLoading(false)); }, []);

  if (loading) {
    return (
      <PublicLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart /><SkeletonChart />
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6 }}>
            <p className="text-xs font-body font-semibold uppercase tracking-widest text-gold mb-3">Transparency Report</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
              Our <span className="italic">Impact</span> in Numbers
            </h1>
            <p className="text-muted-foreground font-body max-w-xl mb-12">
              We believe in full transparency. Here's exactly how your donations are making a difference.
            </p>
          </motion.div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { label: "Survivors Helped", value: impactStats.survivorsHelped.toLocaleString() + "+" },
              { label: "Total Raised", value: "$" + (impactStats.donationsTotal / 1e6).toFixed(1) + "M" },
              { label: "Programs Active", value: impactStats.programsActive.toString() },
              { label: "Success Rate", value: impactStats.successRate + "%" },
            ].map((m, i) => (
              <motion.div key={m.label} initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <p className="text-3xl font-display font-bold text-foreground">{m.value}</p>
                <p className="text-xs font-body text-muted-foreground mt-1 uppercase tracking-wider">{m.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-semibold text-card-foreground mb-1">Monthly Donations</h3>
              <p className="text-xs text-muted-foreground mb-6 font-body">Trailing 9 months</p>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyDonations}>
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(43, 74%, 63%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(43, 74%, 63%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Donations"]} />
                  <Area type="monotone" dataKey="amount" stroke="hsl(43, 74%, 63%)" strokeWidth={2} fill="url(#goldGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-semibold text-card-foreground mb-1">Program Success Rates</h3>
              <p className="text-xs text-muted-foreground mb-6 font-body">Completion percentage by program</p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={programOutcomes} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="program" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} width={90} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "Success Rate"]} />
                  <Bar dataKey="rate" radius={[0, 6, 6, 0]} barSize={20}>
                    {programOutcomes.map((_, i) => (
                      <Cell key={i} fill={["hsl(43,74%,63%)", "hsl(150,18%,56%)", "hsl(213,65%,14%)", "hsl(10,60%,65%)", "hsl(43,74%,63%)"][i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Active Campaigns */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-2xl font-display font-bold text-foreground mb-8">Active Campaigns</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {campaigns.map((c) => {
                const pct = Math.round((c.raised / c.goal) * 100);
                return (
                  <div key={c.name} className="rounded-2xl border border-border bg-card p-6">
                    <h4 className="font-display font-semibold text-card-foreground mb-2">{c.name}</h4>
                    <div className="flex justify-between text-xs font-body text-muted-foreground mb-2">
                      <span>${(c.raised / 1000).toFixed(0)}k raised</span>
                      <span>${(c.goal / 1000).toFixed(0)}k goal</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground font-body">{c.daysLeft} days remaining · {pct}% funded</p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Your Dollar at Work */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-16 rounded-2xl bg-navy text-navy-foreground p-8 md:p-12">
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">Your Dollar at Work</h2>
            <p className="text-navy-foreground/60 font-body text-sm mb-8">Every $100 donated is distributed as follows:</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              {[
                { amt: "$82", label: "Direct Services", desc: "Housing, counseling, and legal aid" },
                { amt: "$8", label: "Training", desc: "Staff development and capacity building" },
                { amt: "$7", label: "Fundraising", desc: "Outreach and donor stewardship" },
                { amt: "$3", label: "Admin", desc: "Essential operations" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-3xl font-display font-bold text-gold">{item.amt}</p>
                  <p className="text-sm font-body font-semibold mt-1">{item.label}</p>
                  <p className="text-xs text-navy-foreground/50 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default ImpactDashboard;
