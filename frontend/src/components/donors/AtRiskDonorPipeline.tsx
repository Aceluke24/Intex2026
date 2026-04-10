import {
  dashboardTableBodyClass,
  dashboardTableHeadCellClass,
  dashboardTableHeadRowClass,
} from "@/components/dashboard-shell";
import { apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
import { cn } from "@/lib/utils";
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

const actionByRiskCategory: Record<string, string> = {
  Critical: "Call within 48h",
  High: "Personalized outreach",
  Medium: "Email re-engagement",
  Low: "Stewardship touchpoint",
};

export function AtRiskDonorPipeline({
  className,
  limit = 10,
  initialView = "at-risk",
}: {
  className?: string;
  limit?: number;
  initialView?: "at-risk" | "recoverable" | "loyal";
}) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rows, setRows] = useState<DonorChurnRow[]>([]);
  const [scoreSource, setScoreSource] = useState<"ml" | "rule-based">("rule-based");
  const [modelVersion, setModelVersion] = useState<string | null>(null);
  const [scoredAt, setScoredAt] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"at-risk" | "loyal" | "recoverable">(initialView);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const retention = await apiFetchJson<DonorRetentionResponse>(`${API_PREFIX}/insights/donor-retention`);
      setRows(retention.rows ?? []);
      setScoreSource(retention.source ?? "rule-based");
      setModelVersion(retention.modelVersion ?? null);
      setScoredAt(retention.scoredAt ?? null);
    } catch (e) {
      console.error(e);
      try {
        const fallback = await apiFetchJson<DonorChurnRow[]>(`${API_PREFIX}/insights/donor-churn`);
        setRows(fallback ?? []);
        setScoreSource("rule-based");
        setModelVersion(null);
        setScoredAt(null);
      } catch (fallbackError) {
        console.error(fallbackError);
        setRows([]);
        setScoreSource("rule-based");
        setModelVersion(null);
        setScoredAt(null);
        setLoadError("Donor risk insights are temporarily unavailable.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const topRows = useMemo(() => {
    let filtered = [...rows];

    if (viewMode === "at-risk") {
      filtered = filtered.filter((d) => d.churnRisk > 0.5 || d.riskCategory === "Critical" || d.riskCategory === "High");
    } else if (viewMode === "loyal") {
      filtered = filtered.filter((d) => {
        const repeatProb = typeof d.repeatProbability180d === "number" ? d.repeatProbability180d : Math.max(0, 1 - d.churnRisk);
        return repeatProb > 0.7;
      });
    } else if (viewMode === "recoverable") {
      filtered = filtered.filter((d) => {
        const repeatProb = typeof d.repeatProbability180d === "number" ? d.repeatProbability180d : Math.max(0, 1 - d.churnRisk);
        return (d.churnRisk > 0.5 || d.riskCategory === "Critical" || d.riskCategory === "High") && repeatProb > 0 && repeatProb <= 0.4;
      });
    }

    return filtered
      .sort((a, b) => {
        if (viewMode === "at-risk") return b.churnRisk - a.churnRisk;
        if (viewMode === "recoverable") {
          const aRepeat = typeof a.repeatProbability180d === "number" ? a.repeatProbability180d : Math.max(0, 1 - a.churnRisk);
          const bRepeat = typeof b.repeatProbability180d === "number" ? b.repeatProbability180d : Math.max(0, 1 - b.churnRisk);
          return aRepeat - bRepeat;
        }
        const aRepeat = typeof a.repeatProbability180d === "number" ? a.repeatProbability180d : Math.max(0, 1 - a.churnRisk);
        const bRepeat = typeof b.repeatProbability180d === "number" ? b.repeatProbability180d : Math.max(0, 1 - b.churnRisk);
        return bRepeat - aRepeat;
      })
      .slice(0, limit);
  }, [limit, rows, viewMode]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-[1.25rem] border border-white/50 bg-white/45 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]",
        className,
      )}
      aria-labelledby="donor-risk-pipeline-heading"
    >
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="donor-risk-pipeline-heading"
            className="font-display text-lg font-semibold tracking-tight text-foreground"
          >
            {viewMode === "at-risk" ? "Donors Requiring Immediate Attention" : viewMode === "recoverable" ? "Recovery Candidates" : "Loyal Supporters"}
          </h2>
          <p className="font-body text-xs text-muted-foreground">
            {viewMode === "at-risk"
              ? "Donors with high churn risk needing immediate attention"
              : viewMode === "recoverable"
                ? "High-risk donors with potential to donate again"
                : "Repeat donors with strong loyalty signals"}
          </p>
          <p className="mt-1 font-body text-[11px] text-muted-foreground">
            Source: {scoreSource === "ml" ? "ML" : "Rule-based"}
            {modelVersion ? ` • Model: ${modelVersion}` : ""}
            {scoredAt ? ` • Scored at: ${new Date(scoredAt).toLocaleString()}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode("at-risk")}
            className={`rounded-lg px-3 py-1.5 font-body text-sm font-medium transition-colors ${
              viewMode === "at-risk"
                ? "border border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-300"
                : "border border-[hsl(350,16%,92%)] bg-white/50 text-muted-foreground hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            }`}
          >
            High Risk
          </button>
          <button
            onClick={() => setViewMode("recoverable")}
            className={`rounded-lg px-3 py-1.5 font-body text-sm font-medium transition-colors ${
              viewMode === "recoverable"
                ? "border border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
                : "border border-[hsl(350,16%,92%)] bg-white/50 text-muted-foreground hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            }`}
          >
            Recoverable
          </button>
          <button
            onClick={() => setViewMode("loyal")}
            className={`rounded-lg px-3 py-1.5 font-body text-sm font-medium transition-colors ${
              viewMode === "loyal"
                ? "border border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "border border-[hsl(350,16%,92%)] bg-white/50 text-muted-foreground hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            }`}
          >
            Loyal
          </button>
        </div>
      </div>

      {loadError ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      {loading ? (
        <p className="font-body text-sm text-muted-foreground">Loading donor risk…</p>
      ) : (
        <div className="overflow-x-auto rounded-[1.1rem] border border-white/40 dark:border-white/10">
          <table className="w-full min-w-[780px] text-left">
            <thead className={dashboardTableHeadRowClass}>
              <tr>
                {["Donor", "Risk band", "Churn Risk (%)", "Repeat Probability", "Last donation", "Recommended Action"].map((h) => (
                  <th key={h} className={dashboardTableHeadCellClass}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={dashboardTableBodyClass}>
              {topRows.map((d) => {
                const category = d.riskCategory || "Low";
                const repeatProbability =
                  typeof d.repeatProbability180d === "number" ? d.repeatProbability180d : Math.max(0, 1 - d.churnRisk);

                return (
                  <tr
                    key={d.supporterId}
                    className="border-b border-[hsl(350,16%,94%)]/80 font-body text-sm text-foreground/90"
                  >
                    <td className="px-2 py-2">
                      <p className="font-medium text-foreground">{d.displayName || `Supporter #${d.supporterId}`}</p>
                      <p className="text-xs text-muted-foreground">{d.supporterType ?? "Supporter"}</p>
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={[
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          category === "Critical" ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" : "",
                          category === "High" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" : "",
                          category === "Medium" ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" : "",
                          category === "Low" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "",
                        ].join(" ")}
                      >
                        {category}
                      </span>
                    </td>
                    <td className="px-2 py-2">{(d.churnRisk * 100).toFixed(0)}%</td>
                    <td className="px-2 py-2">{(repeatProbability * 100).toFixed(0)}%</td>
                    <td className="px-2 py-2">
                      {d.lastDonationDate ? new Date(d.lastDonationDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-2 py-2">{actionByRiskCategory[category] ?? "Review donor profile"}</td>
                  </tr>
                );
              })}
              {!topRows.length && (
                <tr>
                  <td className="px-2 py-3 text-sm text-muted-foreground" colSpan={6}>
                    {viewMode === "at-risk"
                      ? "No high-risk donors found"
                      : viewMode === "recoverable"
                        ? "No recovery candidates found"
                        : "No loyal supporters found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </motion.section>
  );
}

