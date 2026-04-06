import { AdminLayout } from "@/components/AdminLayout";
import { StatCard } from "@/components/StatCard";
import { AIInsightCard } from "@/components/AIInsightCard";
import { SkeletonCard, SkeletonChart } from "@/components/SkeletonLoaders";
import { useState, useEffect } from "react";
import { delay, aiInsights, monthlyDonations, programOutcomes } from "@/lib/mockData";
import { Users, Heart, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

const pieData = [
  { name: "Safe Housing", value: 35 },
  { name: "Counseling", value: 28 },
  { name: "Job Training", value: 20 },
  { name: "Legal Aid", value: 12 },
  { name: "Children's", value: 5 },
];
const COLORS = ["hsl(43,74%,63%)", "hsl(150,18%,56%)", "hsl(213,65%,30%)", "hsl(10,60%,65%)", "hsl(213,65%,50%)"];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => { delay(1000).then(() => setLoading(false)); }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart /><SkeletonChart />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Good morning, Sarah</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Here's what's happening at North Star today.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Residents" value="42" change="+3 this week" changeType="positive" icon={Users} />
          <StatCard label="Monthly Donations" value="$61,200" change="+5.5% vs last month" changeType="positive" icon={Heart} />
          <StatCard label="Active Alerts" value="7" change="2 urgent" changeType="negative" icon={AlertTriangle} />
          <StatCard label="Program Utilization" value="87%" change="+2% this quarter" changeType="positive" icon={Activity} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold text-card-foreground mb-1">Donation Trends</h3>
            <p className="text-xs text-muted-foreground font-body mb-4">Monthly incoming donations</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyDonations}>
                <defs>
                  <linearGradient id="adminGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(43,74%,63%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(43,74%,63%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Donations"]} />
                <Area type="monotone" dataKey="amount" stroke="hsl(43,74%,63%)" strokeWidth={2} fill="url(#adminGold)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Program Utilization Pie */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold text-card-foreground mb-1">Program Distribution</h3>
            <p className="text-xs text-muted-foreground font-body mb-4">Current enrollment by program</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs font-body">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="ml-auto text-card-foreground font-medium">{d.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* AI Insights */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-gold" />
            <h2 className="font-display text-lg font-semibold text-foreground">AI Insights</h2>
            <span className="px-2 py-0.5 rounded-full bg-gold/10 text-gold text-[10px] font-body font-bold uppercase tracking-wider">
              {aiInsights.length} Recommendations
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
