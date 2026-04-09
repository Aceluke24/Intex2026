import { AdminLayout } from "@/components/AdminLayout";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { SlideOverPanel } from "@/components/donors/SlideOverPanel";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch, apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
import { fetchFieldOptions, mapFieldOptionsResidentsToOptions } from "@/lib/visitationsFieldOptions";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RecordCrudActions } from "@/components/ui/RecordCrudActions";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { AlertTriangle, Calendar, Clock, Home, MapPin, Plus, Shield, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ResidentOption = { residentId: number; internalCode: string; caseControlNo: string };
type SelectOption = { value: string; label: string };

type VisitationRow = {
  id: number;
  residentId?: number;
  residentName: string;
  caseId: string;
  visitType: string;
  category: string;
  date: string;
  time: string;
  notes: string;
  staffName: string;
  status: string;
  safetyFlag: boolean;
  observations?: string;
  interventions?: SelectOption[];
  followUps?: SelectOption[];
};

type VisitationListItemApi = {
  id: number;
  residentId: number;
  residentName: string;
  caseId: string;
  visitType: string;
  category: string;
  date: string;
  time: string;
  notes: string;
  observations: string | null;
  purpose: string | null;
  followUpNotes: string | null;
  staffName: string;
  status: string;
  safetyFlag: boolean;
};

type VisitationsPageResponse = {
  total: number;
  page: number;
  pageSize: number;
  homeVisitTotal: number;
  conferenceTotal: number;
  items: VisitationListItemApi[];
};

type VisitationDetail = {
  visitationId: number;
  residentId: number;
  visitDate: string;
  coordinationKind: string;
  visitType: string;
  socialWorker: string;
  locationVisited: string | null;
  purpose: string | null;
  observations: string | null;
  familyCooperationLevel: string | null;
  safetyConcernsNoted: boolean;
  followUpNeeded: boolean;
  followUpNotes: string | null;
  visitOutcome: string | null;
  visitTime: string | null;
};

type VisitFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialData: VisitationRow | null;
  residents: ResidentOption[];
  interventionOptions: SelectOption[];
  followUpOptions: SelectOption[];
  onCreateIntervention: (label: string) => void;
  onCreateFollowUp: (label: string) => void;
  onSave: (payload: {
    id?: number;
    residentId: number;
    date: string;
    type: string;
    staff: string;
    observations: string;
    interventions: SelectOption[];
    followUps: SelectOption[];
    safetyFlag: boolean;
  }) => Promise<void>;
};

const tokenId = (label: string) =>
  label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";

const parseTokenString = (raw: string | null | undefined): SelectOption[] =>
  (raw ?? "")
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((label) => ({ value: tokenId(label), label }));

const toTokenString = (items: SelectOption[]) => items.map((i) => i.label.trim()).filter(Boolean).join("; ");

function mapVisitationItemToRow(item: VisitationListItemApi): VisitationRow {
  return {
    id: item.id,
    residentId: item.residentId,
    residentName: item.residentName,
    caseId: item.caseId,
    visitType: item.visitType,
    category: item.category,
    date: item.date,
    time: item.time,
    notes: item.notes,
    observations: item.observations ?? "",
    interventions: parseTokenString(item.purpose),
    followUps: parseTokenString(item.followUpNotes),
    staffName: item.staffName,
    status: item.status,
    safetyFlag: item.safetyFlag,
  };
}

const PAGE_SIZE = 25;

function MultiCreatableField({
  label,
  options,
  selected,
  setSelected,
  onCreate,
}: {
  label: string;
  options: SelectOption[];
  selected: SelectOption[];
  setSelected: (items: SelectOption[]) => void;
  onCreate: (name: string) => void;
}) {
  const [pick, setPick] = useState("");
  const [draft, setDraft] = useState("");
  const availableOptions = options ?? [];
  const selectedItems = selected ?? [];

  const addOption = (opt: SelectOption) => {
    if (selectedItems.some((s) => s.value === opt.value)) return;
    setSelected([...selectedItems, opt]);
  };

  const removeOption = (value: string) => setSelected(selectedItems.filter((s) => s.value !== value));

  const createAndAdd = () => {
    const name = draft.trim();
    if (!name) return;
    const created = { value: tokenId(name), label: name };
    onCreate(name);
    addOption(created);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <Label className="font-body text-xs">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {selectedItems.map((opt) => (
          <span
            key={opt.value}
            className="inline-flex items-center gap-1 rounded-md bg-[hsl(210_70%_96%)] px-2 py-1 font-body text-xs text-[hsl(210_75%_35%)] dark:bg-[hsl(210_30%_20%)] dark:text-[hsl(210_55%_85%)]"
          >
            {opt.label}
            <button type="button" onClick={() => removeOption(opt.value)} aria-label={`Remove ${opt.label}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Select value={pick} onValueChange={(val) => { setPick(val); const opt = availableOptions.find((o) => o.value === val); if (opt) addOption(opt); }}>
          <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
            <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {availableOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Create ${label.toLowerCase().slice(0, -1)}`}
            className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
          />
          <Button type="button" variant="outline" className="rounded-xl" onClick={createAndAdd}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

function VisitFormModal({
  isOpen,
  onClose,
  initialData,
  residents,
  interventionOptions,
  followUpOptions,
  onCreateIntervention,
  onCreateFollowUp,
  onSave,
}: VisitFormModalProps) {
  const [residentId, setResidentId] = useState("");
  const [type, setType] = useState("HomeVisit");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [staff, setStaff] = useState("");
  const [observations, setObservations] = useState("");
  const [safetyFlag, setSafetyFlag] = useState(false);
  const [selectedInterventions, setSelectedInterventions] = useState<SelectOption[]>([]);
  const [selectedFollowUps, setSelectedFollowUps] = useState<SelectOption[]>([]);
  const [saving, setSaving] = useState(false);
  const residentOptions = residents ?? [];

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setResidentId(String(initialData.residentId ?? ""));
      setType(initialData.visitType);
      setDate(initialData.date);
      setStaff(initialData.staffName ?? "");
      setObservations(initialData.observations ?? initialData.notes ?? "");
      setSafetyFlag(initialData.safetyFlag);
      setSelectedInterventions(initialData.interventions ?? []);
      setSelectedFollowUps(initialData.followUps ?? []);
      return;
    }
    setResidentId(residentOptions[0] ? String(residentOptions[0].residentId) : "");
    setType("HomeVisit");
    setDate(new Date().toISOString().slice(0, 10));
    setStaff("");
    setObservations("");
    setSafetyFlag(false);
    setSelectedInterventions([]);
    setSelectedFollowUps([]);
  }, [isOpen, initialData, residentOptions]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentId) return;
    setSaving(true);
    try {
      await onSave({
        id: initialData?.id,
        residentId: Number(residentId),
        date,
        type,
        staff,
        observations,
        interventions: selectedInterventions,
        followUps: selectedFollowUps,
        safetyFlag,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-[min(100%,34rem)] overflow-y-auto rounded-[1.25rem] border-0 bg-[hsl(36_32%_97%)] p-0 dark:bg-[hsl(213_40%_10%)]">
        <div className="border-b border-white/50 px-6 pb-4 pt-6 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-semibold tracking-tight">
              {initialData ? "Edit visit / conference" : "Log visit / conference"}
            </DialogTitle>
          </DialogHeader>
        </div>
        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label className="font-body text-xs">Resident</Label>
              <Select value={residentId} onValueChange={setResidentId}>
                <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                  <SelectValue placeholder="Select resident" />
                </SelectTrigger>
                <SelectContent>
                  {residentOptions.map((r) => (
                    <SelectItem key={r.residentId} value={String(r.residentId)}>
                      {r.internalCode || `Resident #${r.residentId}`} ({r.caseControlNo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-body text-xs">Visit Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HomeVisit">Home Visit</SelectItem>
                  <SelectItem value="CaseConference">Case Conference</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-body text-xs">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="font-body text-xs">Staff (SW-XX)</Label>
              <Input
                value={staff}
                onChange={(e) => setStaff(e.target.value)}
                placeholder="SW-01"
                className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="font-body text-xs">Observations</Label>
              <Textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="min-h-[110px] rounded-xl border-white/60 bg-white/70 font-body text-sm dark:border-white/10 dark:bg-white/10"
                placeholder="Visit observations"
              />
            </div>
            <div className="sm:col-span-2">
              <MultiCreatableField
                label="Interventions"
                options={interventionOptions}
                selected={selectedInterventions}
                setSelected={setSelectedInterventions}
                onCreate={onCreateIntervention}
              />
            </div>
            <div className="sm:col-span-2">
              <MultiCreatableField
                label="Follow-up actions"
                options={followUpOptions}
                selected={selectedFollowUps}
                setSelected={setSelectedFollowUps}
                onCreate={onCreateFollowUp}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 font-body text-sm cursor-pointer">
                <input type="checkbox" checked={safetyFlag} onChange={(e) => setSafetyFlag(e.target.checked)} className="rounded" />
                Safety concerns noted
              </label>
            </div>
          </div>
          <DialogFooter className="border-t border-white/50 px-0 pt-4 dark:border-white/10">
            <Button type="button" variant="ghost" className="rounded-xl font-body" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !residentId} className="rounded-xl font-body">
              {saving ? "Saving…" : initialData ? "Update visit" : "Save visit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DetailSheet({ v }: { v: VisitationRow }) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-white/45 px-6 pb-6 pt-8 dark:border-white/10">
        <span className="inline-flex rounded-full border border-white/50 bg-white/50 px-2.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-foreground/80 dark:border-white/10">
          {v.visitType === "CaseConference" ? "Case conference" : "Home visit"}
        </span>
        <h2 className="mt-4 font-display text-2xl font-semibold tracking-[-0.03em]">
          {v.residentName}
        </h2>
        <p className="mt-2 font-body text-sm text-muted-foreground">{v.caseId}</p>
        <p className="mt-3 flex flex-wrap items-center gap-3 font-body text-sm text-foreground/90">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 opacity-60" />
            {format(new Date(v.date), "MMMM d, yyyy")}
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 opacity-60" />
            {v.time}
          </span>
        </p>
        <p className="mt-2 font-body text-sm text-muted-foreground">Staff: {v.staffName}</p>
        <p className="mt-1 font-body text-xs text-muted-foreground">Status: {v.status}</p>
      </div>
      <ScrollArea className="flex-1 px-6">
        <div className="space-y-8 py-8 pb-24">
          <section>
            <h3 className="mb-3 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
              Category
            </h3>
            <p className="font-body text-sm text-foreground/90">{v.category}</p>
          </section>
          <section>
            <h3 className="mb-3 flex items-center gap-2 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
              <MapPin className="h-3.5 w-3.5" />
              Notes
            </h3>
            <p className="rounded-[1rem] bg-white/50 px-4 py-3 font-body text-[15px] leading-relaxed text-foreground/92 dark:bg-white/[0.06]">
              {v.notes}
            </p>
          </section>
          <section>
            <h3 className="mb-3 flex items-center gap-2 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
              <Shield className="h-3.5 w-3.5" />
              Safety
            </h3>
            {v.safetyFlag ? (
              <p className="rounded-[1rem] border border-[hsl(0_30%_88%)]/80 bg-[hsl(0_25%_98%)] px-4 py-3 font-body text-sm leading-relaxed text-[hsl(0_30%_28%)] dark:border-[hsl(0_25%_25%)] dark:bg-[hsl(0_22%_14%)] dark:text-[hsl(0_25%_82%)]">
                <AlertTriangle className="mb-1 inline h-4 w-4" /> Safety concerns were noted for this visit.
              </p>
            ) : (
              <p className="font-body text-sm text-muted-foreground">No safety flag on record.</p>
            )}
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}

const VisitationRecordCard = memo(function VisitationRecordCard({
  v,
  i,
  kindLabel,
  onView,
  onEdit,
  onDelete,
}: {
  v: VisitationRow;
  i: number;
  kindLabel: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * Math.min(i, 10), duration: 0.4 }}
      role="button"
      tabIndex={0}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border border-white/50 bg-white/70 p-5 text-left shadow-sm outline-none",
        "transition-all duration-200 ease-out hover:scale-[1.01] hover:shadow-md",
        "dark:border-white/10 dark:bg-white/[0.07]",
        "focus-visible:ring-2 focus-visible:ring-[hsl(340_32%_65%)]/35"
      )}
      onClick={onView}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView();
        }
      }}
    >
      <RecordCrudActions className="absolute right-3 top-3 z-10" onView={onView} onEdit={onEdit} onDelete={onDelete} />
      <div className="pr-2">
        <div className="flex justify-between gap-3 pr-12">
          <div className="min-w-0">
            <div className="font-body text-[11px] uppercase tracking-wide text-muted-foreground">{kindLabel}</div>
            <div className="font-display text-lg font-semibold text-foreground">{v.residentName}</div>
            <div className="font-body text-sm text-muted-foreground">
              {v.caseId} • {v.date}
            </div>
          </div>
          <div className="shrink-0 text-right font-body text-xs text-muted-foreground">{v.staffName}</div>
        </div>
        <div className="mt-2 font-body text-sm text-foreground/85">{v.observations || v.notes || "—"}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(v.interventions ?? []).map((tag) => (
            <span
              key={`${v.id}-${tag.value}`}
              className="rounded bg-blue-50 px-2 py-1 font-body text-xs text-blue-600 dark:bg-blue-900/25 dark:text-blue-200"
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

const VisitationsPage = () => {
  usePageHeader("Visitations & Conferences", "Field & coordination");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rows, setRows] = useState<VisitationRow[]>([]);
  const [tab, setTab] = useState("visits");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [homeVisitTotal, setHomeVisitTotal] = useState(0);
  const [conferenceTotal, setConferenceTotal] = useState(0);
  const [residentFilter, setResidentFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<VisitationRow | null>(null);

  const [fieldOptions, setFieldOptions] = useState<{
    residents: ResidentOption[];
    interventionOptions: SelectOption[];
    followUpOptions: SelectOption[];
  }>({ residents: [], interventionOptions: [], followUpOptions: [] });
  const [selectedVisit, setSelectedVisit] = useState<VisitationRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const ensureResidents = useCallback(async () => {
    if ((fieldOptions.residents?.length ?? 0) > 0) return;
    const data = await fetchFieldOptions();
    const residents = mapFieldOptionsResidentsToOptions(data.residents);
    setFieldOptions({
      residents,
      interventionOptions: data.interventionOptions ?? [],
      followUpOptions: data.followUpOptions ?? [],
    });
  }, [fieldOptions.residents?.length]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const data = await fetchFieldOptions();
      if (cancelled) return;
      setFieldOptions({
        residents: mapFieldOptionsResidentsToOptions(data.residents),
        interventionOptions: data.interventionOptions ?? [],
        followUpOptions: data.followUpOptions ?? [],
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      params.set("coordinationKind", tab === "visits" ? "HomeVisit" : "CaseConference");
      if (residentFilter) params.set("residentId", residentFilter);
      if (dateFrom) params.set("visitDateFrom", dateFrom);
      if (dateTo) params.set("visitDateTo", dateTo);

      const path = `${API_PREFIX}/visitations?${params.toString()}`;
      const t0 = performance.now();
      const res = await apiFetch(path);
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}${text ? `: ${text.slice(0, 200)}` : ""}`);
      }
      const data = JSON.parse(text) as VisitationsPageResponse;
      if (import.meta.env.DEV) {
        const ms = performance.now() - t0;
        console.info(
          `[visitations] ${ms.toFixed(0)}ms ~${text.length} bytes page=${data.page} items=${data.items.length} total=${data.total}`
        );
      }
      setTotal(data.total ?? 0);
      setHomeVisitTotal(data.homeVisitTotal ?? 0);
      setConferenceTotal(data.conferenceTotal ?? 0);
      setRows((data.items ?? []).map(mapVisitationItemToRow));
    } catch (e) {
      console.error(e);
      setLoadError(e instanceof Error ? e.message : "Failed to load visitations.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, tab, residentFilter, dateFrom, dateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const openRow = (v: VisitationRow) => {
    setSelected(v);
    setSheetOpen(true);
  };

  const openCreateModal = async () => {
    try {
      await ensureResidents();
      setSelectedVisit(null);
      setIsModalOpen(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load residents for form.";
      toast.error(message);
    }
  };

  const handleModalSave = async (payload: {
    id?: number;
    residentId: number;
    date: string;
    type: string;
    staff: string;
    observations: string;
    interventions: SelectOption[];
    followUps: SelectOption[];
    safetyFlag: boolean;
  }) => {
    try {
      const body = {
        visitationId: payload.id ?? 0,
        residentId: payload.residentId,
        visitDate: payload.date,
        coordinationKind: payload.type,
        visitType: payload.type === "CaseConference" ? "Case Conference" : "Routine Follow-Up",
        socialWorker: payload.staff || "SW-01",
        locationVisited: null,
        purpose: toTokenString(payload.interventions) || null,
        observations: payload.observations || null,
        familyCooperationLevel: "Cooperative",
        safetyConcernsNoted: payload.safetyFlag,
        followUpNeeded: payload.followUps.length > 0,
        followUpNotes: toTokenString(payload.followUps) || null,
        visitOutcome: "Favorable",
        visitTime: null,
        interventionIds: payload.interventions.map((i) => i.value),
        followUpActionIds: payload.followUps.map((f) => f.value),
      };
      const res = payload.id
        ? await apiFetch(`${API_PREFIX}/visitations/${payload.id}`, { method: "PUT", body: JSON.stringify(body) })
        : await apiFetch(`${API_PREFIX}/visitations`, { method: "POST", body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      toast.success(payload.id ? "Visit updated." : "Visit logged successfully.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save.");
      throw e;
    }
  };

  const handleEditVisitation = async (visit: VisitationRow) => {
    try {
      await ensureResidents();
      const existing = await apiFetchJson<VisitationDetail>(`${API_PREFIX}/visitations/${visit.id}`);
      setSelectedVisit({
        ...visit,
        residentId: existing.residentId,
        date: String(existing.visitDate).slice(0, 10),
        visitType: existing.coordinationKind || visit.visitType,
        staffName: existing.socialWorker ?? visit.staffName,
        observations: existing.observations ?? "",
        interventions: parseTokenString(existing.purpose),
        followUps: parseTokenString(existing.followUpNotes),
        safetyFlag: existing.safetyConcernsNoted,
      });
      setIsModalOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to open visit editor.");
    }
  };

  const handleDeleteVisitation = async (id: number) => {
    if (!window.confirm(`Delete visitation ${id}?`)) return;
    try {
      const res = await apiFetch(`${API_PREFIX}/visitations/${id}?confirm=true`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      if (selected?.id === id) setSheetOpen(false);
      toast.success("Visit deleted.");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete visit.");
    }
  };

  return (
    <AdminLayout contentClassName="max-w-[min(100%,90rem)]">
      <StaffPageShell
        eyebrow="Field operations"
        eyebrowIcon={<Home className="h-3.5 w-3.5 text-[hsl(340_38%_52%)]" strokeWidth={1.5} />}
        title="Home Visitation & Case Conferences"
        description="Visits and coordination records from the central database."
        actions={
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="button"
              onClick={openCreateModal}
              className="relative h-12 overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-r from-[hsl(340_44%_66%)] via-[hsl(350_40%_70%)] to-[hsl(10_44%_56%)] px-6 font-body font-semibold text-white shadow-[0_8px_32px_rgba(190,100,130,0.3)]"
            >
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/22 to-transparent opacity-90" />
              <span className="relative z-[1] flex items-center">
                <Plus className="mr-2 h-4 w-4" strokeWidth={2.25} />
                Log Visit
              </span>
            </Button>
          </motion.div>
        }
      >
        {loadError && (
          <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive">
            {loadError}
          </p>
        )}

        {!loading && fieldOptions.residents.length === 0 && (
          <p className="mb-6 rounded-lg border border-amber-200/60 bg-amber-50/70 px-4 py-3 font-body text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-200">
            No residents are available yet. Add resident case records first, then log a visit.
          </p>
        )}

        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v);
            setPage(1);
          }}
          className="w-full"
        >
          <TabsList className="mb-6 grid h-12 w-full max-w-md grid-cols-2 rounded-2xl border border-white/50 bg-white/45 p-1 shadow-inner backdrop-blur-md dark:border-white/10 dark:bg-white/[0.08]">
            <TabsTrigger
              value="visits"
              className="rounded-xl font-body text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-white/15"
            >
              Home Visits ({homeVisitTotal})
            </TabsTrigger>
            <TabsTrigger
              value="conferences"
              className="rounded-xl font-body text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-white/15"
            >
              Conferences ({conferenceTotal})
            </TabsTrigger>
          </TabsList>

          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-white/50 bg-white/35 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.06] sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-2 sm:min-w-[12rem]">
              <Label className="font-body text-xs">Resident</Label>
              <Select
                value={residentFilter || "__all"}
                onValueChange={(v) => {
                  setResidentFilter(v === "__all" ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                  <SelectValue placeholder="All residents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All residents</SelectItem>
                  {(fieldOptions?.residents ?? []).map((r) => (
                    <SelectItem key={r.residentId} value={String(r.residentId)}>
                      {r.internalCode || `Resident #${r.residentId}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-body text-xs">From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-xs">To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl font-body"
              onClick={() => {
                setResidentFilter("");
                setDateFrom("");
                setDateTo("");
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          </div>

          <TabsContent value="visits" className="mt-0 outline-none">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-48 animate-pulse rounded-[1.15rem] bg-white/40" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  {rows.map((v, i) => (
                    <VisitationRecordCard
                      key={v.id}
                      v={v}
                      i={i}
                      kindLabel={v.visitType === "CaseConference" ? "Case Conference" : "Home Visit"}
                      onView={() => openRow(v)}
                      onEdit={() => void handleEditVisitation(v)}
                      onDelete={() => void handleDeleteVisitation(v.id)}
                    />
                  ))}
                  {rows.length === 0 && (
                    <p className="col-span-full py-16 text-center font-body text-sm text-muted-foreground">
                      No home visits on record.
                    </p>
                  )}
                </div>
                {total > 0 && (
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-4 font-body text-sm text-muted-foreground">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span>
                      Page {page} of {totalPages} ({total} total)
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="conferences" className="mt-0 outline-none">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-40 rounded-[1.15rem] bg-white/40" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  {rows.map((v, i) => (
                    <VisitationRecordCard
                      key={v.id}
                      v={v}
                      i={i}
                      kindLabel="Case Conference"
                      onView={() => openRow(v)}
                      onEdit={() => void handleEditVisitation(v)}
                      onDelete={() => void handleDeleteVisitation(v.id)}
                    />
                  ))}
                  {rows.length === 0 && (
                    <p className="col-span-full py-16 text-center font-body text-sm text-muted-foreground">
                      No case conferences on record.
                    </p>
                  )}
                </div>
                {total > 0 && (
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-4 font-body text-sm text-muted-foreground">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span>
                      Page {page} of {totalPages} ({total} total)
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </StaffPageShell>

      <SlideOverPanel
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        className="sm:max-w-[min(100%,28rem)] lg:max-w-[min(100%,34rem)]"
      >
        {selected && <DetailSheet v={selected} />}
      </SlideOverPanel>

      <VisitFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedVisit}
        residents={fieldOptions?.residents ?? []}
        interventionOptions={fieldOptions?.interventionOptions ?? []}
        followUpOptions={fieldOptions?.followUpOptions ?? []}
        onCreateIntervention={(name) =>
          setFieldOptions((prev) => ({
            ...prev,
            interventionOptions: prev.interventionOptions.some((p) => p.value === tokenId(name))
              ? prev.interventionOptions
              : [...prev.interventionOptions, { value: tokenId(name), label: name }],
          }))
        }
        onCreateFollowUp={(name) =>
          setFieldOptions((prev) => ({
            ...prev,
            followUpOptions: prev.followUpOptions.some((p) => p.value === tokenId(name))
              ? prev.followUpOptions
              : [...prev.followUpOptions, { value: tokenId(name), label: name }],
          }))
        }
        onSave={handleModalSave}
      />
    </AdminLayout>
  );
};

export default VisitationsPage;
