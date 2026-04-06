import { AdminLayout } from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { delay, monthlyDonations, programOutcomes, socialMetrics } from "@/lib/mockData";
import { SkeletonChart, SkeletonCard } from "@/components/SkeletonLoaders";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("9m");
  useEffect(() => { delay(800).then(() => setLoading(false)); }, []);

  return (
    <AdminLayout>
      <div className="space-y-10">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Reports</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">Analytics across programs and operations.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
              {["3m", "6m", "9m", "1y"].map((r) => (
                <button key={r} onClick={() => setRange(r)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all",
                    range === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}>{r}</button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs font-body text-muted-foreground">
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><SkeletonChart className="border-0" /><SkeletonChart className="border-0" /></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="font-body text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground mb-1">Revenue</p>
                <p className="font-body text-xs text-muted-foreground mb-5">Monthly donation revenue</p>
                <div className="bg-card rounded-2xl p-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={monthlyDonations}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(213,15%,55%)" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(213,15%,55%)" }} tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                      <Line type="monotone" dataKey="amount" stroke="hsl(10,55%,65%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(10,55%,65%)" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <p className="font-body text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground mb-1">Programs</p>
                <p className="font-body text-xs text-muted-foreground mb-5">Enrolled vs completed</p>
                <div className="bg-card rounded-2xl p-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={programOutcomes}>
                      <XAxis dataKey="program" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(213,15%,55%)" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(213,15%,55%)" }} />
                      <Tooltip />
                      <Bar dataKey="enrolled" fill="hsl(213,45%,25%)" radius={[4,4,0,0]} barSize={14} name="Enrolled" />
                      <Bar dataKey="completed" fill="hsl(10,55%,65%)" radius={[4,4,0,0]} barSize={14} name="Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Social */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <p className="font-body text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Social Media</p>
                <span className="px-2 py-0.5 rounded-full bg-terracotta/10 text-terracotta text-[10px] font-body font-semibold">AI</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {socialMetrics.map((s) => (
                  <div key={s.platform} className="bg-card rounded-2xl p-5">
                    <p className="font-body text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground mb-3">{s.platform}</p>
                    <p className="font-display text-2xl font-bold text-foreground">{s.followers.toLocaleString()}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs font-body">
                      <span className="text-muted-foreground">{s.engagement}% eng</span>
                      <span className={cn("font-medium", s.growth >= 0 ? "text-sage" : "text-terracotta")}>
                        {s.growth >= 0 ? "+" : ""}{s.growth}%
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
