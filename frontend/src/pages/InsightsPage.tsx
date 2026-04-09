import { AdminLayout } from "@/components/AdminLayout";
import { AIInsightCard } from "@/components/AIInsightCard";
import {
  DASHBOARD_CONTENT_MAX_WIDTH,
  DashboardGlassPanel,
  dashboardTableBodyClass,
  dashboardTableCellClass,
  dashboardTableHeadCellClass,
  dashboardTableHeadRowClass,
  dashboardTableRowClass,
} from "@/components/dashboard-shell";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
import { Brain } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

type DonorChurnRow = {
  supporterId: number;
  displayName: string;
  email?: string | null;
  supporterType?: string | null;
  lastDonationDate?: string | null;
  repeatProbability180d?: number;
  churnRisk: number;
  riskCategory: string;
  scoredAt?: string;
  modelVersion?: string;
};

type DonorRetentionResponse = {
  source: "ml" | "rule-based";
  modelVersion?: string;
  scoredAt?: string;
  message?: string;
  rows: DonorChurnRow[];
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

const actionByRiskCategory: Record<string, string> = {
  Critical: "Call within 48h",
  High: "Personalized outreach",
  Medium: "Email re-engagement",
  Low: "Stewardship touchpoint",
};

const InsightsPage = () => {
  usePageHeader("AI Insights", "Recommendations & signals");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [churn, setChurn] = useState<DonorChurnRow[]>([]);
  const [residentRisk, setResidentRisk] = useState<ResidentRiskRow[]>([]);
  const [donorScoreSource, setDonorScoreSource] = useState<"ml" | "rule-based">("rule-based");
  const [donorModelVersion, setDonorModelVersion] = useState<string | null>(null);
  const [donorScoredAt, setDonorScoredAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [retentionResult, r] = await Promise.allSettled([
        apiFetchJson<DonorRetentionResponse>(`${API_PREFIX}/insights/donor-retention`),
        apiFetchJson<ResidentRiskRow[]>(`${API_PREFIX}/insights/resident-risk`),
      ]);

      if (retentionResult.status === "fulfilled") {
        setChurn(retentionResult.value.rows ?? []);
        setDonorScoreSource(retentionResult.value.source ?? "rule-based");
        setDonorModelVersion(retentionResult.value.modelVersion ?? null);
        setDonorScoredAt(retentionResult.value.scoredAt ?? null);
      } else {
        const fallback = await apiFetchJson<DonorChurnRow[]>(`${API_PREFIX}/insights/donor-churn`);
        setChurn(fallback);
        setDonorScoreSource("rule-based");
        setDonorModelVersion(null);
        setDonorScoredAt(null);
      }

      if (r.status === "fulfilled") {
        setResidentRisk(r.value);
      } else {
        setResidentRisk([]);
      }
    } catch (e) {
      console.error(e);
      setLoadError(e instanceof Error ? e.message : "Failed to load insights.");
      setChurn([]);
      setResidentRisk([]);
      setDonorScoreSource("rule-based");
      setDonorModelVersion(null);
      setDonorScoredAt(null);
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
        description: `${criticalDonors} active supporters are in the critical risk band; ${highChurn} show elevated churn risk (${donorScoreSource === "ml" ? "ML scoring" : "rule-based fallback"}).`,
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
  }, [churn, donorScoreSource, residentRisk, loading]);

  const topAtRiskDonors = useMemo(() => {
    return [...churn]
      .sort((a, b) => b.churnRisk - a.churnRisk)
      .slice(0, 10);
  }, [churn]);

  const avgRepeatProbability = useMemo(() => {
    const values = churn
      .map((x) => x.repeatProbability180d)
      .filter((v): v is number => typeof v === "number");
    if (!values.length) return null;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }, [churn]);

  const insightDescription =
    donorScoreSource === "ml"
      ? "ML-powered donor retention scores are live, with automatic fallback to rule-based scoring if ML data is unavailable."
      : "Rule-based fallback is active for donor retention while ML scores are unavailable.";

  return (
    <AdminLayout contentClassName={DASHBOARD_CONTENT_MAX_WIDTH}>
      <StaffPageShell
        tone="quiet"
        eyebrow="Machine learning"
        eyebrowIcon={<Brain className="h-3.5 w-3.5 text-[hsl(340_38%_52%)]" strokeWidth={1.5} />}
        title="AI Insights"
        description={insightDescription}
      >
        <p className="mb-10 font-body text-xs text-muted-foreground">
          Source: {donorScoreSource === "ml" ? "ML" : "Rule-based"}
          {donorModelVersion ? ` • Model: ${donorModelVersion}` : ""}
          {donorScoredAt ? ` • Scored at: ${new Date(donorScoredAt).toLocaleString()}` : ""}
        </p>

        {loadError ? (
          <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive">
            {loadError}
          </p>
        ) : null}

        {loading ? (
          <p className="font-body text-sm text-muted-foreground">Loading insights…</p>
        ) : (
          <div className="space-y-10">
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

            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              aria-labelledby="top-risk-donors-heading"
            >
              <DashboardGlassPanel>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2
                      id="top-risk-donors-heading"
                      className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl"
                    >
                      Top at-risk donors
                    </h2>
                    <p className="mt-2 font-body text-sm text-muted-foreground">
                      Ranked by predicted churn risk
                      {avgRepeatProbability !== null
                        ? ` • Avg repeat probability: ${(avgRepeatProbability * 100).toFixed(0)}%`
                        : ""}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/50 bg-white/55 px-3 py-1 font-body text-xs text-foreground/80 dark:border-white/10 dark:bg-white/10">
                    {donorScoreSource === "ml" ? "ML ranked" : "Rule-based ranked"}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-[1.1rem] border border-white/40 dark:border-white/10">
                  <table className="w-full min-w-[780px] text-left">
                    <thead className={dashboardTableHeadRowClass}>
                      <tr>
                        {["Donor", "Risk band", "Churn risk", "Repeat prob.", "Last donation", "Suggested outreach"].map((h) => (
                          <th key={h} className={dashboardTableHeadCellClass}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={dashboardTableBodyClass}>
                      {topAtRiskDonors.map((d) => {
                        const category = d.riskCategory || "Low";
                        const repeatProbability =
                          typeof d.repeatProbability180d === "number"
                            ? d.repeatProbability180d
                            : Math.max(0, 1 - d.churnRisk);

                        return (
                          <tr key={d.supporterId} className={dashboardTableRowClass}>
                            <td className={dashboardTableCellClass}>
                              <p className="font-medium text-foreground">{d.displayName || `Supporter #${d.supporterId}`}</p>
                              <p className="font-body text-xs text-muted-foreground">{d.supporterType ?? "Supporter"}</p>
                            </td>
                            <td className={dashboardTableCellClass}>
                              <span
                                className={[
                                  "inline-flex rounded-full px-2 py-0.5 font-body text-xs font-medium",
                                  category === "Critical" ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" : "",
                                  category === "High" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" : "",
                                  category === "Medium" ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" : "",
                                  category === "Low" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "",
                                ].join(" ")}
                              >
                                {category}
                              </span>
                            </td>
                            <td className={dashboardTableCellClass}>{(d.churnRisk * 100).toFixed(0)}%</td>
                            <td className={dashboardTableCellClass}>{(repeatProbability * 100).toFixed(0)}%</td>
                            <td className={`${dashboardTableCellClass} text-muted-foreground`}>
                              {d.lastDonationDate ? new Date(d.lastDonationDate).toLocaleDateString() : "—"}
                            </td>
                            <td className={dashboardTableCellClass}>
                              {actionByRiskCategory[category] ?? "Review donor profile"}
                            </td>
                          </tr>
                        );
                      })}
                      {!topAtRiskDonors.length ? (
                        <tr>
                          <td className={`${dashboardTableCellClass} text-muted-foreground`} colSpan={6}>
                            No donor risk rows available.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </DashboardGlassPanel>
            </motion.section>
          </div>
        )}
      </StaffPageShell>
    </AdminLayout>
  );
};

export default InsightsPage;
