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
              {donorScoreSource === "ml"
                ? "ML-powered donor retention scores are live, with automatic fallback to rule-based scoring if ML data is unavailable."
                : "Rule-based fallback is active for donor retention while ML scores are unavailable."}
            </p>
            <p className="mt-1 font-body text-xs text-muted-foreground">
              Source: {donorScoreSource === "ml" ? "ML" : "Rule-based"}
              {donorModelVersion ? ` • Model: ${donorModelVersion}` : ""}
              {donorScoredAt ? ` • Scored at: ${new Date(donorScoredAt).toLocaleString()}` : ""}
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
          <div className="space-y-8">
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
              className="rounded-[1.25rem] border border-white/50 bg-white/45 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]"
              aria-labelledby="top-risk-donors-heading"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="top-risk-donors-heading" className="font-display text-lg font-semibold tracking-tight text-foreground">
                    Top At-Risk Donors
                  </h2>
                  <p className="font-body text-xs text-muted-foreground">
                    Ranked by predicted churn risk{avgRepeatProbability !== null ? ` • Avg repeat probability: ${(avgRepeatProbability * 100).toFixed(0)}%` : ""}
                  </p>
                </div>
                <span className="rounded-full border border-[hsl(340_26%_78%)] bg-[hsl(340_32%_94%)] px-3 py-1 font-body text-xs text-[hsl(340_35%_38%)]">
                  {donorScoreSource === "ml" ? "ML ranked" : "Rule-based ranked"}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-left">
                  <thead>
                    <tr className="border-b border-[hsl(350,16%,92%)]/90 font-body text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-2">Donor</th>
                      <th className="px-2 py-2">Risk Band</th>
                      <th className="px-2 py-2">Churn Risk</th>
                      <th className="px-2 py-2">Repeat Prob.</th>
                      <th className="px-2 py-2">Last Donation</th>
                      <th className="px-2 py-2">Suggested Outreach</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAtRiskDonors.map((d) => {
                      const category = d.riskCategory || "Low";
                      const repeatProbability =
                        typeof d.repeatProbability180d === "number"
                          ? d.repeatProbability180d
                          : Math.max(0, 1 - d.churnRisk);

                      return (
                        <tr key={d.supporterId} className="border-b border-[hsl(350,16%,94%)]/80 font-body text-sm text-foreground/90">
                          <td className="px-2 py-2">
                            <p className="font-medium text-foreground">{d.displayName || `Supporter #${d.supporterId}`}</p>
                            <p className="text-xs text-muted-foreground">{d.supporterType ?? "Supporter"}</p>
                          </td>
                          <td className="px-2 py-2">
                            <span
                              className={[
                                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                                category === "Critical" ? "bg-rose-100 text-rose-700" : "",
                                category === "High" ? "bg-amber-100 text-amber-700" : "",
                                category === "Medium" ? "bg-sky-100 text-sky-700" : "",
                                category === "Low" ? "bg-emerald-100 text-emerald-700" : "",
                              ].join(" ")}
                            >
                              {category}
                            </span>
                          </td>
                          <td className="px-2 py-2">{(d.churnRisk * 100).toFixed(0)}%</td>
                          <td className="px-2 py-2">{(repeatProbability * 100).toFixed(0)}%</td>
                          <td className="px-2 py-2">{d.lastDonationDate ? new Date(d.lastDonationDate).toLocaleDateString() : "—"}</td>
                          <td className="px-2 py-2">{actionByRiskCategory[category] ?? "Review donor profile"}</td>
                        </tr>
                      );
                    })}
                    {!topAtRiskDonors.length && (
                      <tr>
                        <td className="px-2 py-3 text-sm text-muted-foreground" colSpan={6}>
                          No donor risk rows available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.section>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default InsightsPage;
