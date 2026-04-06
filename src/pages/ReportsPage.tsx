import { AdminLayout } from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { delay, monthlyDonations, programOutcomes, socialMetrics } from "@/lib/mockData";
import { SkeletonChart, SkeletonCard } from "@/components/SkeletonLoaders";
import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("9m");

  useEffect(() => { delay(1000).then(() => setLoading(false)); }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">Comprehensive insights across all programs and operations.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
              {["3m", "6m", "9m", "1y"].map((r) => (
                <Button key={r} variant="ghost" size="sm" onClick={() => setRange(r)}
                  className={cn("h-7 text-xs font-body", range === r && "bg-card shadow-sm")}>{r}</Button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs font-body">
              <Download className="w-3 h-3" /> Export PDF
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><SkeletonChart /><SkeletonChart /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-display font-semibold text-card-foreground mb-1">Revenue Over Time</h3>
                <p className="text-xs text-muted-foreground font-body mb-4">Monthly donation revenue</p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyDonations}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v/1000}k`} />
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                    <Line type="monotone" dataKey="amount" stroke="hsl(43,74%,63%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(43,74%,63%)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-display font-semibold text-card-foreground mb-1">Program Enrollment</h3>
                <p className="text-xs text-muted-foreground font-body mb-4">Current enrolled vs. completed</p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={programOutcomes}>
                    <XAxis dataKey="program" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="enrolled" fill="hsl(213,65%,30%)" radius={[4,4,0,0]} barSize={16} name="Enrolled" />
                    <Bar dataKey="completed" fill="hsl(43,74%,63%)" radius={[4,4,0,0]} barSize={16} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Social Media AI Insights */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-display text-lg font-semibold text-foreground">Social Media Performance</h2>
                <span className="px-2 py-0.5 rounded-full bg-gold/10 text-gold text-[10px] font-body font-bold uppercase">AI Powered</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {socialMetrics.map((s) => (
                  <div key={s.platform} className="rounded-xl border border-border bg-card p-5">
                    <p className="text-xs font-body font-medium uppercase tracking-wider text-muted-foreground mb-2">{s.platform}</p>
                    <p className="text-2xl font-display font-bold text-card-foreground">{s.followers.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground font-body">followers</p>
                    <div className="mt-3 flex items-center gap-3 text-xs font-body">
                      <span className="text-muted-foreground">{s.engagement}% eng.</span>
                      <span className={cn("font-medium", s.growth >= 0 ? "text-sage" : "text-terracotta")}>
                        {s.growth >= 0 ? "+" : ""}{s.growth}% growth
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default ReportsPage;
