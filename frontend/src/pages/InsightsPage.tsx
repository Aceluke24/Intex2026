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
import { apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
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
  riskProbability?: number;
  riskFlag?: boolean;
  riskCategory?: string;
  scoredAt?: string | null;
  modelVersion?: string | null;
};

type ResidentRiskResponse = {
  source: "ml" | "rule-based";
  modelVersion?: string;
  scoredAt?: string;
  message?: string;
  rows: ResidentRiskRow[];
};

type ReintegrationRow = {
  feature: string;
  oddsRatio: number;
  direction: "positive" | "negative";
  significant: boolean;
};

type ReintegrationResponse = {
  available: boolean;
  message?: string;
  trainedAt?: string;
  metrics?: { pseudoR2: number; nObservations: number; aic: number; bic: number };
  hasConvergenceIssues?: boolean;
  rows: ReintegrationRow[];
};

type SocialMediaRow = {
  feature: string;
  irr: number;
  ciLow?: number | null;
  ciHigh?: number | null;
  pValue?: number | null;
  significant: boolean;
};

type SocialMediaResponse = {
  available: boolean;
  message?: string;
  trainedAt?: string;
  metrics?: { aic: number; nPosts: number };
  rows: SocialMediaRow[];
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [churn, setChurn] = useState<DonorChurnRow[]>([]);
  const [residentRisk, setResidentRisk] = useState<ResidentRiskRow[]>([]);
  const [donorScoreSource, setDonorScoreSource] = useState<"ml" | "rule-based">("rule-based");
  const [donorModelVersion, setDonorModelVersion] = useState<string | null>(null);
  const [donorScoredAt, setDonorScoredAt] = useState<string | null>(null);
  const [residentScoreSource, setResidentScoreSource] = useState<"ml" | "rule-based">("rule-based");
  const [residentModelVersion, setResidentModelVersion] = useState<string | null>(null);
  const [residentScoredAt, setResidentScoredAt] = useState<string | null>(null);
  const [residentViewMode, setResidentViewMode] = useState<"needs-intervention" | "escalating" | "baseline-monitoring" | "all-active">("all-active");
  const [donorViewMode, setDonorViewMode] = useState<"at-risk" | "loyal" | "recoverable">("at-risk");
  const [reintegrationMeta, setReintegrationMeta] = useState<ReintegrationResponse | null>(null);
  const [socialMediaMeta, setSocialMediaMeta] = useState<SocialMediaResponse | null>(null);
  const [socialDirectionFilter, setSocialDirectionFilter] = useState<"all" | "boosting" | "reducing">("all");
  const [reintegrationDirectionFilter, setReintegrationDirectionFilter] = useState<"all" | "positive" | "negative">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const loadErrors: string[] = [];

    const [retentionResult, residentResult, reintegrationResult, socialMediaResult] = await Promise.allSettled([
      apiFetchJson<DonorRetentionResponse>(`${API_PREFIX}/insights/donor-retention`),
      apiFetchJson<ResidentRiskResponse>(`${API_PREFIX}/insights/resident-risk-ml`),
      apiFetchJson<ReintegrationResponse>(`${API_PREFIX}/insights/reintegration-analysis`),
      apiFetchJson<SocialMediaResponse>(`${API_PREFIX}/insights/social-media-insights`),
    ]);

    if (retentionResult.status === "fulfilled") {
      setChurn(retentionResult.value.rows ?? []);
      setDonorScoreSource(retentionResult.value.source ?? "rule-based");
      setDonorModelVersion(retentionResult.value.modelVersion ?? null);
      setDonorScoredAt(retentionResult.value.scoredAt ?? null);
    } else {
      try {
        const fallback = await apiFetchJson<DonorChurnRow[]>(`${API_PREFIX}/insights/donor-churn`);
        setChurn(fallback);
        setDonorScoreSource("rule-based");
        setDonorModelVersion(null);
        setDonorScoredAt(null);
      } catch (fallbackError) {
        console.error(fallbackError);
        setChurn([]);
        setDonorScoreSource("rule-based");
        setDonorModelVersion(null);
        setDonorScoredAt(null);
        loadErrors.push("Donor insights are temporarily unavailable.");
      }
    }

    if (residentResult.status === "fulfilled") {
      setResidentRisk(residentResult.value.rows ?? []);
      setResidentScoreSource(residentResult.value.source ?? "rule-based");
      setResidentModelVersion(residentResult.value.modelVersion ?? null);
      setResidentScoredAt(residentResult.value.scoredAt ?? null);
    } else {
      try {
        const fallbackRows = await apiFetchJson<ResidentRiskRow[]>(`${API_PREFIX}/insights/resident-risk`);
        setResidentRisk(fallbackRows ?? []);
        setResidentScoreSource("rule-based");
        setResidentModelVersion(null);
        setResidentScoredAt(null);
      } catch (fallbackError) {
        console.error(fallbackError);
        setResidentRisk([]);
        setResidentScoreSource("rule-based");
        setResidentModelVersion(null);
        setResidentScoredAt(null);
        loadErrors.push("Resident risk insights are temporarily unavailable.");
      }
    }

    if (reintegrationResult.status === "fulfilled") {
      setReintegrationMeta(reintegrationResult.value);
    } else {
      setReintegrationMeta({ available: false, message: "Reintegration insights unavailable.", rows: [] });
    }

    if (socialMediaResult.status === "fulfilled") {
      setSocialMediaMeta(socialMediaResult.value);
    } else {
      setSocialMediaMeta({ available: false, message: "Social media insights unavailable.", rows: [] });
    }

    setLoadError(loadErrors.length ? loadErrors.join(" ") : null);
    setLoading(false);
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
    let filtered = [...churn];

    if (donorViewMode === "at-risk") {
      // Show high churn risk donors (churnRisk > 0.5 or Critical/High categories)
      filtered = filtered.filter((d) => d.churnRisk > 0.5 || d.riskCategory === "Critical" || d.riskCategory === "High");
    } else if (donorViewMode === "loyal") {
      // Show loyal donors (repeat probability > 0.7)
      filtered = filtered.filter((d) => {
        const repeatProb = typeof d.repeatProbability180d === "number" ? d.repeatProbability180d : Math.max(0, 1 - d.churnRisk);
        return repeatProb > 0.7;
      });
    } else if (donorViewMode === "recoverable") {
      // Show high-risk donors with low but non-zero repeat probability (recovery candidates)
      filtered = filtered.filter((d) => {
        const repeatProb = typeof d.repeatProbability180d === "number" ? d.repeatProbability180d : Math.max(0, 1 - d.churnRisk);
        return (d.churnRisk > 0.5 || d.riskCategory === "Critical" || d.riskCategory === "High") && repeatProb > 0 && repeatProb <= 0.4;
      });
    }

    return filtered
      .sort((a, b) => {
        if (donorViewMode === "at-risk") {
          return b.churnRisk - a.churnRisk;
        } else if (donorViewMode === "recoverable") {
          // For recoverable, sort by repeat probability (ascending, so lowest recovery potential first for prioritization)
          const aRepeat = typeof a.repeatProbability180d === "number" ? a.repeatProbability180d : Math.max(0, 1 - a.churnRisk);
          const bRepeat = typeof b.repeatProbability180d === "number" ? b.repeatProbability180d : Math.max(0, 1 - b.churnRisk);
          return aRepeat - bRepeat;
        } else {
          // For loyal, sort by repeat probability descending
          const aRepeat = typeof a.repeatProbability180d === "number" ? a.repeatProbability180d : Math.max(0, 1 - a.churnRisk);
          const bRepeat = typeof b.repeatProbability180d === "number" ? b.repeatProbability180d : Math.max(0, 1 - b.churnRisk);
          return bRepeat - aRepeat;
        }
      })
      .slice(0, 10);
  }, [churn, donorViewMode]);

  const avgRepeatProbability = useMemo(() => {
    const values = churn
      .map((x) => x.repeatProbability180d)
      .filter((v): v is number => typeof v === "number");
    if (!values.length) return null;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }, [churn]);

  const prioritizedResidents = useMemo(() => {
    let filtered = [...residentRisk];

    if (residentViewMode === "needs-intervention") {
      // Open incidents OR escalated
      filtered = filtered.filter((r) => r.openIncidents > 0 || r.riskEscalated);
    } else if (residentViewMode === "escalating") {
      // Risk prob >= 0.5 AND no open incidents yet
      filtered = filtered.filter((r) => {
        const probability = typeof r.riskProbability === "number" ? r.riskProbability : 0;
        return probability >= 0.5 && r.openIncidents === 0 && !r.riskEscalated;
      });
    } else if (residentViewMode === "baseline-monitoring") {
      // Everything else with activity
      filtered = filtered.filter((r) => {
        const probability = typeof r.riskProbability === "number" ? r.riskProbability : 0;
        return probability < 0.5 && r.openIncidents === 0 && !r.riskEscalated;
      });
    }

    return filtered
      .sort((a, b) => {
        const aProb = typeof a.riskProbability === "number" ? a.riskProbability : 0;
        const bProb = typeof b.riskProbability === "number" ? b.riskProbability : 0;
        if (bProb !== aProb) return bProb - aProb;
        if (b.openIncidents !== a.openIncidents) return b.openIncidents - a.openIncidents;
        return b.recentConcernsCount - a.recentConcernsCount;
      })
      .slice(0, 12);
  }, [residentRisk, residentViewMode]);

  const socialMediaRows = useMemo(() => {
    const rows = socialMediaMeta?.rows ?? [];
    let filtered = [...rows];

    if (socialDirectionFilter === "boosting") {
      filtered = filtered.filter((r) => r.irr >= 1);
    } else if (socialDirectionFilter === "reducing") {
      filtered = filtered.filter((r) => r.irr < 1);
    }

    return [...filtered].sort((a, b) => {
      const aDistance = Math.abs(a.irr - 1);
      const bDistance = Math.abs(b.irr - 1);
      if (bDistance !== aDistance) return bDistance - aDistance;
      return b.irr - a.irr;
    });
  }, [socialMediaMeta, socialDirectionFilter]);

  const socialBoostingCount = useMemo(
    () => (socialMediaMeta?.rows ?? []).filter((r) => r.irr >= 1).length,
    [socialMediaMeta]
  );

  const socialReducingCount = useMemo(
    () => (socialMediaMeta?.rows ?? []).filter((r) => r.irr < 1).length,
    [socialMediaMeta]
  );

  const reintegrationRows = useMemo(() => {
    const rows = reintegrationMeta?.rows ?? [];
    let filtered = [...rows];

    if (reintegrationDirectionFilter !== "all") {
      filtered = filtered.filter((r) => r.direction === reintegrationDirectionFilter);
    }

    return filtered.sort(
      (a, b) => Math.abs(Math.log(b.oddsRatio)) - Math.abs(Math.log(a.oddsRatio))
    );
  }, [reintegrationMeta, reintegrationDirectionFilter]);

  const reintegrationPositiveCount = useMemo(
    () => (reintegrationMeta?.rows ?? []).filter((r) => r.direction === "positive").length,
    [reintegrationMeta]
  );

  const reintegrationNegativeCount = useMemo(
    () => (reintegrationMeta?.rows ?? []).filter((r) => r.direction === "negative").length,
    [reintegrationMeta]
  );

  const insightDescription =
    donorScoreSource === "ml"
      ? `ML donor retention scores are live (${residentScoreSource === "ml" ? "resident ML also live" : "resident fallback active"}).`
      : `Rule-based donor fallback is active (${residentScoreSource === "ml" ? "resident ML live" : "resident fallback active"}).`;

  return (
    <AdminLayout contentClassName={DASHBOARD_CONTENT_MAX_WIDTH}>
      <StaffPageShell title="AI Insights" description={insightDescription}>
        <p className="mb-10 font-body text-xs text-muted-foreground">
          Source: {donorScoreSource === "ml" ? "ML" : "Rule-based"}
          {donorModelVersion ? ` • Model: ${donorModelVersion}` : ""}
          {donorScoredAt ? ` • Scored at: ${new Date(donorScoredAt).toLocaleString()}` : ""}
          {` • Resident source: ${residentScoreSource === "ml" ? "ML" : "Rule-based"}`}
          {residentModelVersion ? ` • Resident model: ${residentModelVersion}` : ""}
          {residentScoredAt ? ` • Resident scored at: ${new Date(residentScoredAt).toLocaleString()}` : ""}
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
              className="rounded-[1.25rem] border border-white/50 bg-white/45 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]"
              aria-labelledby="donor-list-heading"
            >
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 
                    id="donor-list-heading" 
                    className="font-display text-lg font-semibold tracking-tight text-foreground"
                  >
                    {donorViewMode === "at-risk" 
                      ? "At-Risk Donors" 
                      : donorViewMode === "recoverable" 
                      ? "Recovery Candidates" 
                      : "Loyal Supporters"}
                  </h2>
                  <p className="font-body text-xs text-muted-foreground">
                    {donorViewMode === "at-risk"
                      ? "Donors with high churn risk needing immediate attention"
                      : donorViewMode === "recoverable"
                      ? "High-risk donors with potential to donate again"
                      : "Repeat donors with strong loyalty signals"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setDonorViewMode("at-risk")}
                    className={`rounded-lg px-3 py-1.5 font-body text-sm font-medium transition-colors ${
                      donorViewMode === "at-risk"
                        ? "border border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : "border border-[hsl(350,16%,92%)] bg-white/50 text-muted-foreground hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    }`}
                  >
                    At-Risk
                  </button>
                  <button
                    onClick={() => setDonorViewMode("recoverable")}
                    className={`rounded-lg px-3 py-1.5 font-body text-sm font-medium transition-colors ${
                      donorViewMode === "recoverable"
                        ? "border border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        : "border border-[hsl(350,16%,92%)] bg-white/50 text-muted-foreground hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    }`}
                  >
                    Recoverable
                  </button>
                  <button
                    onClick={() => setDonorViewMode("loyal")}
                    className={`rounded-lg px-3 py-1.5 font-body text-sm font-medium transition-colors ${
                      donorViewMode === "loyal"
                        ? "border border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "border border-[hsl(350,16%,92%)] bg-white/50 text-muted-foreground hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    }`}
                  >
                    Loyal
                  </button>
                </div>
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
                          {donorViewMode === "at-risk"
                            ? "No high-risk donors found"
                            : donorViewMode === "recoverable"
                            ? "No recovery candidates found"
                            : "No loyal supporters found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[1.25rem] border border-white/50 bg-white/45 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]"
              aria-labelledby="resident-list-heading"
            >
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 id="resident-list-heading" className="font-display text-lg font-semibold tracking-tight text-foreground">
                    Resident Risk Priorities
                  </h2>
                  <p className="font-body text-xs text-muted-foreground">
                    Ranked by risk probability, then open incidents and concern volume.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setResidentViewMode("needs-intervention")}
                    className={`rounded-lg px-3 py-1.5 font-body text-sm font-medium transition-colors ${
                      residentViewMode === "needs-intervention"
                        ? "border border-red-300 bg-red-100 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300"
                        : "border border-[hsl(350,16%,92%)] bg-white/50 text-muted-foreground hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    }`}
                  >
                    Needs Intervention
                  </button>
                  <button
                    onClick={() => setResidentViewMode("escalating")}
                    className={`rounded-lg px-3 py-1.5 font-body text-sm font-medium transition-colors ${
                      residentViewMode === "escalating"
                        ? "border border-orange-300 bg-orange-100 text-orange-700 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300"
                        : "border border-[hsl(350,16%,92%)] bg-white/50 text-muted-foreground hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    }`}
                  >
                    Escalating
                  </button>
                  <button
                    onClick={() => setResidentViewMode("baseline-monitoring")}
                    className={`rounded-lg px-3 py-1.5 font-body text-sm font-medium transition-colors ${
                      residentViewMode === "baseline-monitoring"
                        ? "border border-green-300 bg-green-100 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300"
                        : "border border-[hsl(350,16%,92%)] bg-white/50 text-muted-foreground hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    }`}
                  >
                    Baseline Monitoring
                  </button>
                  <button
                    onClick={() => setResidentViewMode("all-active")}
                    className={`rounded-lg px-3 py-1.5 font-body text-sm font-medium transition-colors ${
                      residentViewMode === "all-active"
                        ? "border border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-300"
                        : "border border-[hsl(350,16%,92%)] bg-white/50 text-muted-foreground hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    }`}
                  >
                    All Residents
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-[1.1rem] border border-white/40 dark:border-white/10">
                <table className="w-full min-w-[980px] text-left">
                  <thead className={dashboardTableHeadRowClass}>
                    <tr>
                      {[
                        "Resident",
                        "Current level",
                        "Risk %",
                        "Flag",
                        "Escalated",
                        "Open incidents",
                        "Concern logs",
                        "Scored",
                      ].map((h) => (
                        <th key={h} className={dashboardTableHeadCellClass}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={dashboardTableBodyClass}>
                    {prioritizedResidents.map((r) => {
                      const probability = typeof r.riskProbability === "number" ? r.riskProbability : 0;

                      return (
                        <tr key={r.residentId} className={dashboardTableRowClass}>
                          <td className={dashboardTableCellClass}>
                            <p className="font-medium text-foreground">{r.internalCode || `Resident #${r.residentId}`}</p>
                            <p className="text-xs text-muted-foreground">{r.caseControlNo || `ID ${r.residentId}`}</p>
                          </td>
                          <td className={dashboardTableCellClass}>{r.currentRiskLevel ?? "Unknown"}</td>
                          <td className={dashboardTableCellClass}>{(probability * 100).toFixed(0)}%</td>
                          <td className={dashboardTableCellClass}>
                            {r.riskFlag ? (
                              <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">Yes</span>
                            ) : (
                              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">No</span>
                            )}
                          </td>
                          <td className={dashboardTableCellClass}>{r.riskEscalated ? "Yes" : "No"}</td>
                          <td className={dashboardTableCellClass}>{r.openIncidents}</td>
                          <td className={dashboardTableCellClass}>{r.recentConcernsCount}</td>
                          <td className={dashboardTableCellClass}>{r.scoredAt ? new Date(r.scoredAt).toLocaleDateString() : "Operational"}</td>
                        </tr>
                      );
                    })}
                    {!prioritizedResidents.length && (
                      <tr>
                        <td className="px-2 py-3 text-sm text-muted-foreground" colSpan={8}>
                          No residents match this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.section>

            {/* ── Social Media Insights ── */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[1.25rem] border border-white/50 bg-white/45 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]"
              aria-labelledby="social-media-heading"
            >
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 id="social-media-heading" className="font-display text-lg font-semibold tracking-tight text-foreground">
                    Social Media Insights
                  </h2>
                  <p className="font-body text-xs text-muted-foreground">
                    Post characteristics associated with higher donation referrals — Negative Binomial regression
                    {socialMediaMeta?.metrics ? ` • n=${socialMediaMeta.metrics.nPosts} posts • AIC ${socialMediaMeta.metrics.aic?.toFixed(0)}` : ""}
                    {socialMediaMeta?.trainedAt ? ` • Trained ${new Date(socialMediaMeta.trainedAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
                {socialMediaMeta?.available && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSocialDirectionFilter("all")}
                      className={`rounded-lg px-3 py-1.5 font-body text-sm font-medium transition-colors ${
                        socialDirectionFilter === "all"
                          ? "border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                          : "border border-[hsl(350,16%,92%)] bg-white/50 text-muted-foreground hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                      }`}
                    >
                      All directions
                    </button>
                    <button
                      onClick={() => setSocialDirectionFilter("boosting")}
                      className={`rounded-lg px-3 py-1.5 font-body text-sm font-medium transition-colors ${
                        socialDirectionFilter === "boosting"
                          ? "border border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "border border-[hsl(350,16%,92%)] bg-white/50 text-muted-foreground hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                      }`}
                    >
                      Boosting ({socialBoostingCount})
                    </button>
                    <button
                      onClick={() => setSocialDirectionFilter("reducing")}
                      className={`rounded-lg px-3 py-1.5 font-body text-sm font-medium transition-colors ${
                        socialDirectionFilter === "reducing"
                          ? "border border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : "border border-[hsl(350,16%,92%)] bg-white/50 text-muted-foreground hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                      }`}
                    >
                      Reducing ({socialReducingCount})
                    </button>
                  </div>
                )}
              </div>

              {!socialMediaMeta?.available ? (
                <p className="font-body text-sm text-muted-foreground">
                  {socialMediaMeta?.message ?? "Social media model artifacts not found. Run train_social_media_insights.py to generate them."}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-[1.1rem] border border-white/40 dark:border-white/10">
                  <table className="w-full min-w-[700px] text-left">
                    <thead className={dashboardTableHeadRowClass}>
                      <tr>
                        {["Factor", "IRR", "95% CI", "p-value", "Signal"].map((h) => (
                          <th key={h} className={dashboardTableHeadCellClass}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={dashboardTableBodyClass}>
                      {socialMediaRows.map((row) => (
                        <tr key={row.feature} className={dashboardTableRowClass}>
                          <td className={dashboardTableCellClass}>
                            <span className="font-medium text-foreground">{row.feature}</span>
                          </td>
                          <td className={dashboardTableCellClass}>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                row.irr >= 1
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              }`}
                            >
                              {row.irr.toFixed(2)}×
                            </span>
                          </td>
                          <td className={dashboardTableCellClass}>
                            {row.ciLow != null && row.ciHigh != null
                              ? `${row.ciLow.toFixed(2)} – ${row.ciHigh.toFixed(2)}`
                              : "—"}
                          </td>
                          <td className={dashboardTableCellClass}>
                            {row.pValue != null
                              ? row.pValue < 0.001
                                ? row.pValue.toExponential(2)
                                : row.pValue.toFixed(3)
                              : "—"}
                          </td>
                          <td className={dashboardTableCellClass}>
                            {row.significant ? (
                              <span className="text-emerald-600 dark:text-emerald-400">{row.irr >= 1 ? "▲ Boosts" : "▼ Reduces"}</span>
                            ) : (
                              <span className="text-muted-foreground">–</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {!socialMediaRows.length && (
                        <tr>
                          <td className="px-2 py-3 text-sm text-muted-foreground" colSpan={5}>
                            No factors match this filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.section>

            {/* ── Reintegration Success Factors ── */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[1.25rem] border border-white/50 bg-white/45 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]"
              aria-labelledby="reintegration-heading"
            >
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 id="reintegration-heading" className="font-display text-lg font-semibold tracking-tight text-foreground">
                    Reintegration Success Factors
                  </h2>
                  <p className="font-body text-xs text-muted-foreground">
                    Directional associations with successful reintegration — Logistic regression
                    {reintegrationMeta?.metrics ? ` • n=${reintegrationMeta.metrics.nObservations} residents` : ""}
                    {reintegrationMeta?.trainedAt ? ` • Trained ${new Date(reintegrationMeta.trainedAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
                {reintegrationMeta?.available && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setReintegrationDirectionFilter("all")}
                      className={`rounded-lg px-3 py-1.5 font-body text-sm font-medium transition-colors ${
                        reintegrationDirectionFilter === "all"
                          ? "border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                          : "border border-[hsl(350,16%,92%)] bg-white/50 text-muted-foreground hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                      }`}
                    >
                      All directions
                    </button>
                    <button
                      onClick={() => setReintegrationDirectionFilter("positive")}
                      className={`rounded-lg px-3 py-1.5 font-body text-sm font-medium transition-colors ${
                        reintegrationDirectionFilter === "positive"
                          ? "border border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "border border-[hsl(350,16%,92%)] bg-white/50 text-muted-foreground hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                      }`}
                    >
                      Positive ({reintegrationPositiveCount})
                    </button>
                    <button
                      onClick={() => setReintegrationDirectionFilter("negative")}
                      className={`rounded-lg px-3 py-1.5 font-body text-sm font-medium transition-colors ${
                        reintegrationDirectionFilter === "negative"
                          ? "border border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : "border border-[hsl(350,16%,92%)] bg-white/50 text-muted-foreground hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                      }`}
                    >
                      Negative ({reintegrationNegativeCount})
                    </button>
                  </div>
                )}
              </div>

              {!reintegrationMeta?.available ? (
                <p className="font-body text-sm text-muted-foreground">
                  {reintegrationMeta?.message ?? "Reintegration model artifacts not found. Run train_reintegration_analysis.py to generate them."}
                </p>
              ) : (
                <>
                  {reintegrationMeta.hasConvergenceIssues && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 font-body text-sm text-amber-800 dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-300">
                      Model fit is near-perfect on this dataset (likely due to limited sample size), so odds ratios and confidence intervals are unreliable. Directions below are indicators only.
                    </div>
                  )}
                  <div className="overflow-x-auto rounded-[1.1rem] border border-white/40 dark:border-white/10">
                    <table className="w-full min-w-[560px] text-left">
                      <thead className={dashboardTableHeadRowClass}>
                        <tr>
                          {["Factor", "Direction", "Significance", "Relative strength"].map((h) => (
                            <th key={h} className={dashboardTableHeadCellClass}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={dashboardTableBodyClass}>
                        {reintegrationRows.map((row) => {
                          const logMag = Math.abs(Math.log(Math.max(row.oddsRatio, 1e-40)));
                          const maxLogMag = Math.abs(Math.log(Math.max(reintegrationRows[0]?.oddsRatio ?? 1, 1e-40)));
                          const strengthPct = maxLogMag > 0 ? Math.round((logMag / maxLogMag) * 100) : 0;
                          return (
                            <tr key={row.feature} className={dashboardTableRowClass}>
                              <td className={dashboardTableCellClass}>
                                <span className="font-medium text-foreground">{row.feature.replace(/_/g, " ")}</span>
                              </td>
                              <td className={dashboardTableCellClass}>
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                    row.direction === "positive"
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                      : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                  }`}
                                >
                                  {row.direction === "positive" ? "Positive" : "Negative"}
                                </span>
                              </td>
                              <td className={dashboardTableCellClass}>
                                {row.significant ? (
                                  <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                    Significant
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                    Not significant
                                  </span>
                                )}
                              </td>
                              <td className={dashboardTableCellClass}>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                                    <div
                                      className={`h-full rounded-full ${row.direction === "positive" ? "bg-emerald-500" : "bg-rose-500"}`}
                                      style={{ width: `${strengthPct}%` }}
                                    />
                                  </div>
                                  <span className="font-body text-xs text-muted-foreground">{strengthPct}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {!reintegrationRows.length && (
                          <tr>
                            <td className="px-2 py-3 text-sm text-muted-foreground" colSpan={4}>
                              No reintegration factors available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </motion.section>
          </div>
        )}
      </StaffPageShell>
    </AdminLayout>
  );
};

export default InsightsPage;
