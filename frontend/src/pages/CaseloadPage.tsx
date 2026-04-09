import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { AdminLayout } from "@/components/AdminLayout";
import {
  AddEditCaseDialog,
  CaseDetailSheet,
  CaseRow,
  CaseloadFilterBar,
  type CaseloadFilters,
  CaseloadMetricCard,
} from "@/components/caseload";
import { SlideOverPanel } from "@/components/donors/SlideOverPanel";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
import { DASHBOARD_CONTENT_MAX_WIDTH } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  computeCaseloadMetrics,
  caseCategories,
  type CaseStatus,
  type ResidentCase,
  type RiskLevel,
} from "@/lib/caseloadTypes";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { apiFetch, apiFetchJson } from "@/lib/apiFetch";
import { exportToCSV } from "@/lib/exportToCSV";
import { API_PREFIX } from "@/lib/apiBase";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Archive,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FolderOpen,
  Plus,
  UserCheck,
  Users,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type CaseApiRow = {
  residentId: number;
  caseId: string;
  residentName: string;
  category: string;
  subcategory: string;
  birthStatus: string | null;
  religion: string | null;
  safehouse: string;
  assignedWorker: string | null;
  admissionDate: string;
  ageUponAdmission: string | null;
  presentAge: string | null;
  lengthOfStay: string | null;
  referringAgencyPerson: string | null;
  dateColbRegistered: string | null;
  dateColbObtained: string | null;
  dateCaseStudyPrepared: string | null;
  reintegrationType: string | null;
  reintegrationStatus: string | null;
  dateClosed: string | null;
  familyParentPwd: boolean;
  status: string;
  reintegrationProgress: number;
  lastUpdated: string;
  riskLevel: string;
};

type SafehouseApi = { safehouseId: number; name: string };

function mapApiStatus(s: string): CaseStatus {
  const m: Record<string, CaseStatus> = {
    Active: "Active",
    Closed: "Closed",
    Pending: "Pending",
    Reintegration: "Reintegration",
    HighRisk: "HighRisk",
    Transferred: "Transferred",
  };
  return m[s] ?? "Active";
}

function mapRisk(r: string): RiskLevel {
  if (r === "High") return "High";
  if (r === "Elevated") return "Elevated";
  return "Standard";
}

function mapSubcategoryFlags(category: ResidentCase["category"], subcategory: string) {
  const sub = subcategory.toLowerCase();
  return {
    subCatOrphaned: sub.includes("orphan") || category === "Abandonment",
    subCatTrafficked: sub.includes("traffick") || category === "Trafficking",
    subCatChildLabor: sub.includes("labor") || sub.includes("labour"),
    subCatPhysicalAbuse: sub.includes("physical") || category === "Abuse",
    subCatSexualAbuse: sub.includes("sexual"),
    subCatOsaec: sub.includes("osaec") || sub.includes("online sexual"),
    subCatCicl: sub.includes("cicl") || sub.includes("conflict with law"),
    subCatAtRisk: sub.includes("at risk") || category === "Domestic violence",
    subCatStreetChild: sub.includes("street") || category === "Displacement",
    subCatChildWithHiv: sub.includes("hiv"),
  };
}

/** Primary card label: real/synthetic resident line only — never repeat the system case id (C####). */
function deriveResidentPrimaryLabel(row: CaseApiRow): string {
  const caseId = (row.caseId ?? "").trim();
  const residentName = (row.residentName ?? "").trim();
  if (!residentName) return "Resident";
  if (caseId && residentName.toUpperCase() === caseId.toUpperCase()) return "Resident";
  return residentName;
}

/** API uses "Resident {InternalCode}" — form and filters use the code alone (e.g. LS-0067). */
function residentDisplayCodeFromApiLabel(label: string): string {
  const t = (label ?? "").trim();
  if (!t) return "";
  const m = /^resident\s+/i.exec(t);
  if (m) return t.slice(m[0].length).trim();
  return t;
}

function mapCaseRow(row: CaseApiRow): ResidentCase {
  const phaseIndex = Math.min(3, Math.max(0, Math.floor(row.reintegrationProgress / 25)));
  return {
    id: row.caseId || `R-${row.residentId}`,
    displayName: residentDisplayCodeFromApiLabel(deriveResidentPrimaryLabel(row)),
    anonymized: true,
    age: 0,
    ageUponAdmission: row.ageUponAdmission ?? "",
    presentAge: row.presentAge ?? "",
    lengthOfStay: row.lengthOfStay ?? "",
    gender: "—",
    birthStatus: row.birthStatus,
    religion: row.religion,
    category: row.category as ResidentCase["category"],
    subcategory: row.subcategory,
    disability: null,
    socio: {
      fourPsBeneficiary: false,
      soloParentHousehold: false,
      indigenousGroup: null,
      informalSettler: false,
    },
    familyParentPwd: row.familyParentPwd,
    admissionDate: row.admissionDate,
    referralSource: "—",
    referringAgencyPerson: row.referringAgencyPerson,
    originLocation: "—",
    dateColbRegistered: row.dateColbRegistered,
    dateColbObtained: row.dateColbObtained,
    dateCaseStudyPrepared: row.dateCaseStudyPrepared,
    safehouse: row.safehouse,
    assignedWorker: row.assignedWorker ?? "—",
    reintegrationType: row.reintegrationType,
    reintegrationStatus: row.reintegrationStatus,
    dateClosed: row.dateClosed,
    caseNotes: "—",
    status: mapApiStatus(row.status),
    riskLevel: mapRisk(row.riskLevel),
    reintegrationProgress: row.reintegrationProgress,
    phaseIndex,
    lastUpdate: row.lastUpdated,
    timeline: [],
    keywords: [],
  };
}

const defaultFilters: CaseloadFilters = {
  search: "",
  status: "All",
  safehouse: "All",
  category: "All",
  worker: "All",
  dateRange: undefined,
};

/** Calendar YYYY-MM-DD for comparisons; strips time and avoids lexicographic bugs (e.g. "2024-01-15T00:00:00Z" > "2024-01-15"). */
function normalizeAdmissionDateToIso(value: string | null | undefined): string | null {
  if (value == null) return null;
  const t = value.trim();
  if (!t) return null;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(t);
  if (m) return m[1]!;
  const ms = Date.parse(t);
  if (Number.isNaN(ms)) return null;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** Inclusive local calendar bounds from the date picker (single-day range when `to` is missing). */
function inclusiveLocalIsoRange(from: Date, to: Date): { start: string; end: string } {
  const a = format(from, "yyyy-MM-dd");
  const b = format(to, "yyyy-MM-dd");
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

function matchesFilters(c: ResidentCase, f: CaseloadFilters): boolean {
  const q = f.search.toLowerCase().trim();
  if (q) {
    const blob = [c.displayName, c.id, c.category, c.subcategory, c.keywords.join(" "), c.caseNotes]
      .join(" ")
      .toLowerCase();
    if (!blob.includes(q)) return false;
  }
  if (f.status !== "All" && c.status !== f.status) return false;
  if (f.safehouse !== "All" && c.safehouse !== f.safehouse) return false;
  if (f.category !== "All" && c.category !== f.category) return false;
  if (f.worker !== "All" && c.assignedWorker !== f.worker) return false;
  if (f.dateRange?.from) {
    const { start, end } = inclusiveLocalIsoRange(f.dateRange.from, f.dateRange.to ?? f.dateRange.from);
    const adm = normalizeAdmissionDateToIso(c.admissionDate);
    if (!adm) {
      console.debug("[Caseload admission filter] case", {
        caseId: c.id,
        admissionRaw: c.admissionDate,
        normalizedAdmission: null,
        start,
        end,
        inRange: false,
        excludeReason: "missing_or_invalid_admission_date",
      });
      return false;
    }
    const inRange = adm >= start && adm <= end;
    console.debug("[Caseload admission filter] case", {
      caseId: c.id,
      admissionRaw: c.admissionDate,
      normalizedAdmission: adm,
      start,
      end,
      inRange,
      ...(!inRange && { excludeReason: adm < start ? "before_start" : "after_end" }),
    });
    if (!inRange) return false;
  }
  return true;
}

type SortKey = "admission" | "name" | "updated";

const PAGE_SIZE = 6;

function dateToIsoOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const CaseloadPage = () => {
  usePageHeader("Caseload Inventory", "Resident cases & reintegration");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cases, setCases] = useState<ResidentCase[]>([]);
  const [safehouseList, setSafehouseList] = useState<SafehouseApi[]>([]);
  const [residentIdMap, setResidentIdMap] = useState<Record<string, number>>({});
  const [safehouseNames, setSafehouseNames] = useState<string[]>([]);
  const [filters, setFilters] = useState<CaseloadFilters>(defaultFilters);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ResidentCase | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("admission");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [suggestedNextDisplayName, setSuggestedNextDisplayName] = useState<string | null>(null);
  const [deleteTargetCase, setDeleteTargetCase] = useState<ResidentCase | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [caseRows, houses] = await Promise.all([
        apiFetchJson<CaseApiRow[]>(`${API_PREFIX}/cases`),
        apiFetchJson<SafehouseApi[]>(`${API_PREFIX}/safehouses`),
      ]);
      const mapped = caseRows.map(mapCaseRow);
      setCases(mapped);
      setSafehouseList(houses);
      setSafehouseNames(houses.map((h) => h.name).filter(Boolean));
      // Build a map from caseControlNo / R-{id} → residentId for API updates
      const idMap: Record<string, number> = {};
      caseRows.forEach((r) => {
        idMap[r.caseId] = r.residentId;
        idMap[`R-${r.residentId}`] = r.residentId;
      });
      setResidentIdMap(idMap);

      void apiFetchJson<{ displayName: string }>(`${API_PREFIX}/residents/next-display-name`)
        .then((r) => setSuggestedNextDisplayName(r.displayName))
        .catch(() => setSuggestedNextDisplayName("LS-0001"));
    } catch (e) {
      console.error(e);
      setLoadError(e instanceof Error ? e.message : "Failed to load caseload.");
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const workerOptions = useMemo(() => {
    const w = new Set<string>();
    cases.forEach((c) => {
      if (c.assignedWorker && c.assignedWorker !== "—") w.add(c.assignedWorker);
    });
    return Array.from(w).sort((a, b) => a.localeCompare(b));
  }, [cases]);

  const categoryOptions = useMemo(() => {
    const u = new Set<string>(caseCategories);
    cases.forEach((c) => u.add(c.category));
    return Array.from(u);
  }, [cases]);

  const metrics = useMemo(() => computeCaseloadMetrics(cases), [cases]);

  const shForUi = safehouseNames.length > 0 ? safehouseNames : Array.from(new Set(cases.map((c) => c.safehouse))).filter(Boolean);
  const workersForUi = workerOptions.length > 0 ? workerOptions : ["—"];

  const filtered = useMemo(() => {
    if (filters.dateRange?.from) {
      const { start, end } = inclusiveLocalIsoRange(
        filters.dateRange.from,
        filters.dateRange.to ?? filters.dateRange.from
      );
      console.debug("[Caseload admission filter] inclusive range (applied)", { start, end, caseCount: cases.length });
    }
    return cases.filter((c) => matchesFilters(c, filters));
  }, [cases, filters]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortKey === "name") {
      arr.sort((a, b) => a.displayName.localeCompare(b.displayName));
    } else if (sortKey === "updated") {
      arr.sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());
    } else {
      arr.sort((a, b) => new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime());
    }
    return arr;
  }, [filtered, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, safePage]);

  useEffect(() => {
    setPage(1);
  }, [filtered.length, sortKey]);

  const selected = useMemo(() => cases.find((c) => c.id === selectedId) ?? null, [cases, selectedId]);

  const openCase = (id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const from = filters.dateRange?.from ? format(filters.dateRange.from, "yyyy-MM-dd") : undefined;
      const to = filters.dateRange?.to
        ? format(filters.dateRange.to, "yyyy-MM-dd")
        : filters.dateRange?.from
          ? format(filters.dateRange.from, "yyyy-MM-dd")
          : undefined;
      await exportToCSV(
        `${API_PREFIX}/cases/export`,
        {
          status: filters.status,
          safehouse: filters.safehouse,
          category: filters.category,
          worker: filters.worker,
          search: filters.search.trim() || undefined,
          admissionFrom: from,
          admissionTo: to,
        },
        { defaultFilename: "caseload_export.csv" }
      );
    } catch (e) {
      console.error(e);
      toast.error("Export failed", {
        description: e instanceof Error ? e.message : "Could not download CSV.",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleSaveCase = async (c: ResidentCase) => {
    // Map UI category to API enum (Abandoned | Foundling | Surrendered | Neglected)
    const categoryMap: Record<string, string> = {
      Abandoned: "Abandoned", Foundling: "Foundling", Surrendered: "Surrendered",
      Neglect: "Neglected", "Domestic violence": "Neglected", Trafficking: "Neglected",
      Abuse: "Neglected", Exploitation: "Neglected", Displacement: "Abandoned",
    };
    const riskMap: Record<string, string> = { Standard: "Low", Elevated: "Medium", High: "High" };

    const residentId = residentIdMap[c.id];
    const safehouse = safehouseList.find((sh) => sh.name === c.safehouse);
    const safehouseId = safehouse?.safehouseId ?? safehouseList[0]?.safehouseId ?? 1;
    const fallbackDob = new Date(new Date().getFullYear() - (c.age || 18), 0, 1).toISOString().slice(0, 10);
    let dateOfBirth = fallbackDob;

    // Preserve existing DOB on updates to avoid overriding with synthetic age-derived values.
    if (residentId) {
      try {
        const existing = await apiFetchJson<{ dateOfBirth?: string }>(`${API_PREFIX}/residents/${residentId}`);
        if (existing?.dateOfBirth) {
          dateOfBirth = String(existing.dateOfBirth).slice(0, 10);
        }
      } catch {
        // Keep fallback DOB if resident detail cannot be loaded.
      }
    }

    const apiStatus = c.status === "Reintegration" ? "Active" : (c.status === "Pending" ? "Active" : c.status);
    const subFlags = mapSubcategoryFlags(c.category, c.subcategory ?? "");
    const normalizedSex = c.gender?.toLowerCase().startsWith("m") ? "M" : "F";

    const trimmedDisplay = c.displayName.trim();
    const internalCode = /^LS-\d+$/i.test(trimmedDisplay) ? trimmedDisplay : undefined;

    const body = {
      safehouseId,
      caseStatus: apiStatus,
      sex: normalizedSex,
      dateOfBirth,
      birthStatus: c.birthStatus,
      religion: c.religion,
      caseCategory: categoryMap[c.category] ?? "Neglected",
      placeOfBirth: c.originLocation !== "—" ? c.originLocation : null,
      ...subFlags,
      dateOfAdmission: c.admissionDate,
      dateEnrolled: c.admissionDate,
      ageUponAdmission: c.ageUponAdmission || null,
      presentAge: c.presentAge || null,
      lengthOfStay: c.lengthOfStay || null,
      referralSource: c.referralSource !== "—" ? c.referralSource : "Community",
      referringAgencyPerson: c.referringAgencyPerson,
      dateColbRegistered: dateToIsoOrNull(c.dateColbRegistered),
      dateColbObtained: dateToIsoOrNull(c.dateColbObtained),
      dateCaseStudyPrepared: dateToIsoOrNull(c.dateCaseStudyPrepared),
      assignedSocialWorker: c.assignedWorker !== "—" ? c.assignedWorker : null,
      initialCaseAssessment: c.caseNotes !== "—" ? c.caseNotes : "Intake assessment",
      initialRiskLevel: riskMap[c.riskLevel] ?? "Low",
      currentRiskLevel: riskMap[c.riskLevel] ?? "Low",
      reintegrationType: c.reintegrationType,
      reintegrationStatus: c.reintegrationStatus,
      dateClosed: dateToIsoOrNull(c.dateClosed),
      familyIs4ps: c.socio.fourPsBeneficiary,
      familySoloParent: c.socio.soloParentHousehold,
      familyIndigenous: !!c.socio.indigenousGroup,
      familyParentPwd: c.familyParentPwd,
      familyInformalSettler: c.socio.informalSettler,
      isPwd: !!c.disability,
      pwdType: c.disability || null,
      hasSpecialNeeds: !!c.disability,
      specialNeedsDiagnosis: c.disability || null,
      notesRestricted: c.caseNotes !== "—" ? c.caseNotes : null,
      ...(internalCode ? { internalCode } : {}),
    };

    try {
      const res = residentId
        ? await apiFetch(`${API_PREFIX}/residents/${residentId}`, {
            method: "PUT",
            body: JSON.stringify({ residentId, ...body }),
          })
        : await apiFetch(`${API_PREFIX}/residents`, { method: "POST", body: JSON.stringify(body) });

      if (res.status === 409) {
        toast.error("That display code is already in use. Choose another.");
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      toast.success(residentId ? "Case record updated." : "Case record created.");
      setEditing(null);
      void load();
    } catch (e) {
      toast.error("Save failed: " + (e instanceof Error ? e.message : "Unknown error"));
    }
  };

  const caseDeleteDetailLines = useMemo(() => {
    if (!deleteTargetCase) return undefined;
    return [
      { label: "Case ID", value: deleteTargetCase.id },
      { label: "Resident", value: deleteTargetCase.displayName },
    ];
  }, [deleteTargetCase]);

  const confirmDeleteCase = async (): Promise<boolean> => {
    if (!deleteTargetCase) return false;
    const c = deleteTargetCase;
    const residentId = residentIdMap[c.id];
    if (!residentId) {
      toast.error("Unable to resolve resident ID.");
      return false;
    }
    try {
      const res = await apiFetch(`${API_PREFIX}/residents/${residentId}?confirm=true`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Case deleted.");
      if (selectedId === c.id) setSheetOpen(false);
      await load();
      return true;
    } catch (e) {
      console.error(e);
      toast.error("Delete failed.");
      return false;
    }
  };

  return (
    <AdminLayout contentClassName={DASHBOARD_CONTENT_MAX_WIDTH}>
      <StaffPageShell
        tone="quiet"
        eyebrow="Case management"
        eyebrowIcon={<ClipboardList className="h-3.5 w-3.5 text-[hsl(340_38%_52%)]" strokeWidth={1.5} />}
        title="Caseload Inventory"
        description="Manage resident cases, track progress, and support reintegration."
        actions={
          <>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
              <Button
                type="button"
                disabled={loading}
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                className="relative h-12 overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-r from-[hsl(340_44%_66%)] via-[hsl(350_40%_70%)] to-[hsl(10_44%_56%)] px-6 font-body font-semibold text-white shadow-[0_8px_32px_rgba(190,100,130,0.32)] transition-shadow duration-300 hover:shadow-[0_14px_44px_rgba(190,100,130,0.42)]"
              >
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/22 to-transparent opacity-90" />
                <span className="relative z-[1] flex items-center">
                  <Plus className="mr-2 h-4 w-4" strokeWidth={2.25} />
                  Add Case
                </span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => void handleExport()}
                disabled={exporting || loading}
                aria-busy={exporting}
                className="h-12 rounded-2xl border border-white/50 bg-white/50 px-6 font-body font-medium text-foreground/80 shadow-[0_4px_24px_rgba(45,35,48,0.05)] backdrop-blur-md transition-all hover:border-white/80 hover:bg-white/82 hover:text-foreground dark:border-white/10 dark:bg-white/[0.07] dark:hover:bg-white/12"
              >
                <Download className="mr-2 h-4 w-4 opacity-70" strokeWidth={1.5} />
                Export Records
              </Button>
            </motion.div>
          </>
        }
      >
        {loadError && (
          <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive">
            {loadError}
          </p>
        )}

          {loading ? (
            <div className="mb-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] rounded-[1.1rem] bg-white/45" />
              ))}
            </div>
          ) : (
            <section className="mb-12 xl:mb-16">
              <div className="mb-4 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground/60" strokeWidth={1.5} />
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                  Caseload overview
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <CaseloadMetricCard
                  label="Total active cases"
                  value={metrics.active}
                  icon={Users}
                  motionDelay={0}
                />
                <CaseloadMetricCard
                  label="New admissions (month)"
                  value={metrics.newThisMonth}
                  icon={UserCheck}
                  motionDelay={0.05}
                />
                <CaseloadMetricCard
                  label="Cases in reintegration"
                  value={metrics.reint}
                  icon={ClipboardList}
                  motionDelay={0.1}
                />
                <CaseloadMetricCard
                  label="High-risk cases"
                  value={metrics.highRisk}
                  icon={AlertTriangle}
                  motionDelay={0.14}
                  variant="critical"
                />
                <CaseloadMetricCard
                  label="Closed cases"
                  value={metrics.closed}
                  icon={Archive}
                  motionDelay={0.18}
                />
              </div>
            </section>
          )}

          {!loading && (
            <section className="mb-10">
              <CaseloadFilterBar
                filters={filters}
                onFiltersChange={setFilters}
                safehouses={shForUi.length ? shForUi : ["—"]}
                workers={workersForUi}
                categories={categoryOptions}
              />
            </section>
          )}

          <section className="mb-6">
            <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                  Records
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
                  Case inventory
                </h2>
                <p className="mt-2 font-body text-sm text-muted-foreground">
                  {filtered.length} {filtered.length === 1 ? "case" : "cases"} match your criteria
                </p>
              </div>
              {!loading && filtered.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                    Sort
                  </span>
                  <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                    <SelectTrigger className="h-10 w-[200px] rounded-xl border-white/50 bg-white/60 font-body text-xs dark:border-white/10 dark:bg-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admission">Admission date (newest)</SelectItem>
                      <SelectItem value="updated">Last update (recent)</SelectItem>
                      <SelectItem value="name">Resident name (A–Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="mt-2 space-y-3.5">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-[132px] rounded-[1.15rem] bg-white/40" />
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {paginated.map((c, i) => (
                    <CaseRow
                      key={c.id}
                      residentCase={c}
                      index={i}
                      onView={() => openCase(c.id)}
                      onEdit={() => {
                        setEditing(c);
                        setFormOpen(true);
                      }}
                      onDelete={() => setDeleteTargetCase(c)}
                    />
                  ))}
                </AnimatePresence>
              )}
              {!loading && filtered.length > 0 && pageCount > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/35 pt-6 dark:border-white/10">
                  <p className="font-body text-xs text-muted-foreground">
                    Page {safePage} of {pageCount} · {PAGE_SIZE} per page
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl border-white/50 bg-white/50 dark:border-white/10"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl border-white/50 bg-white/50 dark:border-white/10"
                      disabled={safePage >= pageCount}
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {!loading && filtered.length === 0 && (
                <p className="py-20 text-center font-body text-sm text-muted-foreground">
                  No cases match these filters. Adjust search or clear filters to see more records.
                </p>
              )}
            </div>
          </section>
      </StaffPageShell>

      <SlideOverPanel
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        className="sm:max-w-[min(100%,28rem)] lg:max-w-[min(100%,36rem)]"
      >
        {selected && <CaseDetailSheet c={selected} />}
      </SlideOverPanel>

      <AddEditCaseDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        onSave={handleSaveCase}
        safehouseOptions={shForUi.length ? shForUi : ["—"]}
        workerOptions={workersForUi}
        suggestedNextDisplayName={suggestedNextDisplayName}
      />

      <ConfirmDeleteModal
        open={deleteTargetCase !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetCase(null);
        }}
        title="Delete case?"
        detailLines={caseDeleteDetailLines}
        onConfirm={confirmDeleteCase}
      />
    </AdminLayout>
  );
};

export default CaseloadPage;
