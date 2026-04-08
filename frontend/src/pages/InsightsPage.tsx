import { AdminLayout } from "@/components/AdminLayout";
import { AIInsightCard } from "@/components/AIInsightCard";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
import { Brain } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

type DonorChurnRow = {
  supporterId: number;
  displayName: string;
  churnRisk: number;
  riskCategory: string;
};

type ResidentRiskRow = {
  residentId: number;
  caseControlNo: string;
  internalCode: string;
  currentRiskLevel: string | null;
  riskEscalated: boolean;
  recentConcernsCount: number;
  openIncidents: number;
};

type InsightCard = {
  type: string;
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
  action: string;
};

const InsightsPage = () => {
  usePageHeader("AI Insights", "Recommendations & signals");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [churn, setChurn] = useState<DonorChurnRow[]>([]);
  const [residentRisk, setResidentRisk] = useState<ResidentRiskRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [c, r] = await Promise.all([
        apiFetchJson<DonorChurnRow[]>(`${API_PREFIX}/insights/donor-churn`),
        apiFetchJson<ResidentRiskRow[]>(`${API_PREFIX}/insights/resident-risk`),
      ]);
      setChurn(c);
      setResidentRisk(r);
    } catch (e) {
      console.error(e);
      setLoadError(e instanceof Error ? e.message : "Failed to load insights.");
      setChurn([]);
      setResidentRisk([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = useMemo((): InsightCard[] => {
    if (loading) return [];
    const out: InsightCard[] = [];
    const criticalDonors = churn.filter((x) => x.riskCategory === "Critical").length;
    const highChurn = churn.filter((x) => x.churnRisk >= 0.5).length;
    if (churn.length > 0) {
      out.push({
        type: "churn",
        title: "Donor retention signals",
        description: `${criticalDonors} active supporters are in the critical inactivity window; ${highChurn} show elevated churn risk (rule-based scores).`,
        urgency: criticalDonors > 0 ? "high" : "medium",
        action: "Review donor list",
      });
    }
    const escalated = residentRisk.filter((x) => x.riskEscalated).length;
    const concerns = residentRisk.filter((x) => x.recentConcernsCount > 0).length;
    const incidents = residentRisk.filter((x) => x.openIncidents > 0).length;
    if (residentRisk.length > 0) {
      out.push({
        type: "resident",
        title: "Active resident risk",
        description: `${escalated} cases show escalated risk versus intake; ${concerns} have recent flagged process recordings; ${incidents} have open incidents.`,
        urgency: escalated > 0 || incidents > 0 ? "high" : "low",
        action: "Open caseload",
      });
    }
    if (out.length === 0) {
      out.push({
        type: "prediction",
        title: "Models in calibration",
        description: "Insight endpoints are returning data. As more cases and donations accumulate, rankings will stabilize.",
        urgency: "low",
        action: "Refresh",
      });
    }
    return out;
  }, [churn, residentRisk, loading]);

  return (
    <AdminLayout contentClassName="max-w-[1000px]">
      <div className="space-y-10 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 rounded-[1.25rem] border border-white/50 bg-white/45 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[hsl(340_32%_94%)] dark:bg-[hsl(340_22%_18%)]">
            <Brain className="h-6 w-6 text-[hsl(340_35%_48%)]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground lg:text-3xl">AI Insights</h1>
            <p className="mt-2 font-body text-sm leading-relaxed text-muted-foreground">
              Rule-based scores from live donor and resident data — swap in model outputs when your ML pipeline is ready.
            </p>
          </div>
        </motion.div>

        {loadError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive">
            {loadError}
          </p>
        )}

        {loading ? (
          <p className="font-body text-sm text-muted-foreground">Loading insights…</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {cards.map((insight, i) => (
              <motion.div
                key={`${insight.title}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="transition-transform duration-200 hover:-translate-y-1"
              >
                <AIInsightCard {...insight} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default InsightsPage;
