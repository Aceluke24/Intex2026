import { AdminLayout } from "@/components/AdminLayout";
import { AIInsightCard } from "@/components/AIInsightCard";
import { SkeletonCard, SkeletonChart } from "@/components/SkeletonLoaders";
import { useState, useEffect } from "react";
import { delay, aiInsights, monthlyDonations } from "@/lib/mockData";
import { Users, Heart, AlertTriangle, Activity, Brain } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

const pieData = [
  { name: "Safe Housing", value: 35 },
  { name: "Counseling", value: 28 },
  { name: "Job Training", value: 20 },
  { name: "Legal Aid", value: 12 },
  { name: "Children's", value: 5 },
];
const COLORS = ["hsl(10,55%,65%)", "hsl(150,18%,56%)", "hsl(213,65%,30%)", "hsl(43,74%,63%)", "hsl(213,55%,50%)"];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => { delay(800).then(() => setLoading(false)); }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <SkeletonCard key={i} className="border-0" />)}
          </div>
          <SkeletonChart className="border-0" />
        </div>
      </AdminLayout>
    );
  }

  const stats = [
    { label: "Active Residents", value: "42", sub: "+3 this week", icon: Users, color: "text-terracotta" },
    { label: "Monthly Donations", value: "$61.2k", sub: "+5.5% vs last month", icon: Heart, color: "text-sage" },
    { label: "Active Alerts", value: "7", sub: "2 urgent", icon: AlertTriangle, color: "text-terracotta" },
    { label: "Utilization", value: "87%", sub: "+2% this quarter", icon: Activity, color: "text-sage" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-12">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Good morning, Sarah</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">Here's what needs your attention today.</p>
        </div>

        {/* Stats — clean, no borders */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <div className="group">
                <div className="flex items-center gap-2 mb-3">
                  <s.icon className="w-4 h-4 text-muted-foreground" />
                  <p className="font-body text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">{s.label}</p>
                </div>
                <p className={`font-display text-3xl font-bold text-foreground ${s.color}`}>{s.value}</p>
                <p className="font-body text-xs text-muted-foreground mt-1">{s.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Chart */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="lg:col-span-8">
            <p className="font-body text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground mb-1">Donation trends</p>
            <p className="font-body text-xs text-muted-foreground mb-6">Monthly incoming donations</p>
            <div className="bg-card rounded-2xl p-6">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyDonations}>
                  <defs>
                    <linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(10,55%,65%)" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(10,55%,65%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(213,15%,55%)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(213,15%,55%)" }} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Donations"]} />
                  <Area type="monotone" dataKey="amount" stroke="hsl(10,55%,65%)" strokeWidth={2} fill="url(#dGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Pie */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="lg:col-span-4">
            <p className="font-body text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground mb-1">Programs</p>
            <p className="font-body text-xs text-muted-foreground mb-6">Current enrollment</p>
            <div className="bg-card rounded-2xl p-6">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-1.5">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs font-body">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="ml-auto text-foreground font-medium">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* AI Insights */}
        <div>
          <div className="flex items-center gap-2.5 mb-6">
            <Brain className="w-4 h-4 text-terracotta" />
            <p className="font-body text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">AI Insights</p>
            <span className="px-2 py-0.5 rounded-full bg-terracotta/10 text-terracotta text-[10px] font-body font-semibold">
              {aiInsights.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiInsights.slice(0, 4).map((insight, i) => (
              <AIInsightCard key={i} {...insight} />
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
