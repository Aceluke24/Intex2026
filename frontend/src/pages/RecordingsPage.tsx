import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { AdminLayout } from "@/components/AdminLayout";
import { DASHBOARD_CONTENT_MAX_WIDTH } from "@/components/dashboard-shell";
import { ResidentSelector, SessionEntrySheet, SessionTimeline } from "@/components/processRecording";
import { SlideOverPanel } from "@/components/donors/SlideOverPanel";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
import {
  type EmotionalTag,
  mapApiEmotionalState,
  type ProcessResidentOption,
  type ProcessSessionEntry,
  type SessionType,
} from "@/lib/processRecordingTypes";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type RecordingListItem = {
  id: number;
  recordingId: number;
  residentId: number;
  sessionDate: string;
  sessionType: string;
  residentName: string;
  clinicianName: string;
  emotionalState: string;
  note: string | null;
  date: string;
  caseId?: string;
  durationMinutes?: number | null;
};

type RecordingListResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: RecordingListItem[];
};

type ResidentApi = {
  residentId: number;
  caseControlNo: string;
  internalCode: string;
  caseCategory: string;
  assignedSocialWorker: string | null;
};

type ResidentsResponse = { items: ResidentApi[] };

function mapListItemToEntry(item: RecordingListItem): ProcessSessionEntry {
  const sessionType: SessionType = item.sessionType?.toLowerCase() === "group" ? "Group" : "Individual";
  const note = item.note?.trim() || "—";
  const id = String(item.recordingId ?? item.id);
  return {
    id,
    residentId: String(item.residentId),
    date: item.date || item.sessionDate,
    worker: item.clinicianName?.trim() || "—",
    sessionType,
    residentDisplayName: item.residentName,
    caseId: item.caseId || `R-${item.residentId}`,
    durationMinutes: item.durationMinutes ?? null,
    emotionalState: mapApiEmotionalState(item.emotionalState || ""),
    narrativePreview: note,
    emotionalObserved: item.emotionalState?.trim() || "—",
    narrativeFull: note,
    interventions: "—",
    followUp: "—",
  };
}

type RecordingEditorState = {
  open: boolean;
  mode: "create" | "edit";
  recordingId: string | null;
  residentId: string;
  date: string;
  worker: string;
  sessionType: SessionType;
  durationMinutes: string;
  emotionalState: EmotionalTag;
  narrative: string;
  interventions: string;
  followUp: string;
};

function mapResident(r: ResidentApi): ProcessResidentOption {
  const display = r.internalCode?.trim()
    ? `Resident ${r.internalCode}`
    : `Resident #${r.residentId}`;
  return {
    id: String(r.residentId),
    displayName: display,
    caseId: r.caseControlNo?.trim() || `R-${r.residentId}`,
    category: r.caseCategory || "—",
  };
}

const RecordingsPage = () => {
  const [loadingResidents, setLoadingResidents] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ProcessSessionEntry[]>([]);
  const [residents, setResidents] = useState<ProcessResidentOption[]>([]);
  const [residentFilter, setResidentFilter] = useState<string | "all">("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const timelineTopRef = useRef<HTMLDivElement | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [detailEntry, setDetailEntry] = useState<ProcessSessionEntry | null>(null);
  const [editor, setEditor] = useState<RecordingEditorState>({
    open: false,
    mode: "create",
    recordingId: null,
    residentId: "",
    date: new Date().toISOString().slice(0, 10),
    worker: "",
    sessionType: "Individual",
    durationMinutes: "",
    emotionalState: "Hopeful",
    narrative: "",
    interventions: "",
    followUp: "",
  });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const PAGE_SIZE = 10;

  const loadResidents = useCallback(async () => {
    setLoadingResidents(true);
    setLoadError(null);
    try {
      const resRes = await apiFetchJson<ResidentsResponse>(`${API_PREFIX}/residents?page=1&pageSize=500`);
      setResidents(resRes.items.map(mapResident));
    } catch (e) {
      console.error(e);
      setLoadError(e instanceof Error ? e.message : "Failed to load residents.");
      setResidents([]);
    } finally {
      setLoadingResidents(false);
    }
  }, []);

  const loadSessions = useCallback(
    async (pageToLoad: number) => {
      setLoadingSessions(true);
      setLoadError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageToLoad));
        params.set("limit", String(PAGE_SIZE));
        if (residentFilter !== "all") params.set("residentId", residentFilter);
        const recRes = await apiFetchJson<RecordingListResponse>(`${API_PREFIX}/recordings?${params.toString()}`);
        setSessions(recRes.items.map(mapListItemToEntry));
        setTotal(recRes.total);
      } catch (e) {
        console.error(e);
        setLoadError(e instanceof Error ? e.message : "Failed to load recordings.");
        setSessions([]);
        setTotal(0);
      } finally {
        setLoadingSessions(false);
      }
    },
    [residentFilter]
  );

  useEffect(() => {
    void loadResidents();
  }, [loadResidents]);

  useEffect(() => {
    void loadSessions(page);
  }, [loadSessions, page]);

  useEffect(() => {
    setPage(1);
  }, [residentFilter]);

  const workersForDialog = useMemo(() => {
    const w = new Set<string>();
    sessions.forEach((s) => {
      if (s.worker && s.worker !== "—") w.add(s.worker);
    });
    return w.size > 0 ? Array.from(w).sort((a, b) => a.localeCompare(b)) : ["—"];
  }, [sessions]);

  useEffect(() => {
    if (!selectedEntryId) {
      setDetailEntry(null);
      return;
    }
    const base = sessions.find((s) => s.id === selectedEntryId);
    if (!base) {
      setDetailEntry(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await apiFetchJson<Record<string, unknown>>(`${API_PREFIX}/recordings/${selectedEntryId}`);
        if (cancelled) return;
        const narrative = typeof r.sessionNarrative === "string" ? r.sessionNarrative : base.narrativeFull;
        const emotional =
          typeof r.emotionalStateObserved === "string" ? r.emotionalStateObserved : base.emotionalObserved;
        const interventions =
          typeof r.interventionsApplied === "string" && r.interventionsApplied.trim()
            ? r.interventionsApplied
            : base.interventions;
        const followUp =
          typeof r.followUpActions === "string" && r.followUpActions.trim() ? r.followUpActions : base.followUp;
        const worker = typeof r.socialWorker === "string" && r.socialWorker.trim() ? r.socialWorker : base.worker;
        setDetailEntry({
          ...base,
          narrativeFull: narrative || base.narrativeFull,
          emotionalObserved: emotional || base.emotionalObserved,
          interventions,
          followUp,
          worker,
        });
      } catch {
        if (!cancelled) setDetailEntry(base);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedEntryId, sessions]);

  const filteredSessions = useMemo(() => {
    // Server already applies resident filter and newest-first ordering.
    return sessions;
  }, [sessions]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const openEntry = (id: string) => {
    setSelectedEntryId(id);
    setSheetOpen(true);
  };

  const openCreateEditor = () => {
    setEditor({
      open: true,
      mode: "create",
      recordingId: null,
      residentId: residentFilter !== "all" ? residentFilter : residents[0]?.id ?? "",
      date: new Date().toISOString().slice(0, 10),
      worker: workersForDialog[0] ?? "",
      sessionType: "Individual",
      durationMinutes: "",
      emotionalState: "Hopeful",
      narrative: "",
      interventions: "",
      followUp: "",
    });
  };

  const handleEditEntry = async (id: string) => {
    try {
      const existing = await apiFetchJson<Record<string, unknown>>(`${API_PREFIX}/recordings/${id}`);
      setEditor({
        open: true,
        mode: "edit",
        recordingId: id,
        residentId: String(existing.residentId ?? ""),
        date: String(existing.sessionDate ?? new Date().toISOString().slice(0, 10)),
        worker: String(existing.socialWorker ?? ""),
        sessionType:
          String(existing.sessionType ?? "").toLowerCase() === "group" ? "Group" : "Individual",
        durationMinutes:
          existing.sessionDurationMinutes == null ? "" : String(existing.sessionDurationMinutes),
        emotionalState: mapApiEmotionalState(String(existing.emotionalStateObserved ?? "")),
        narrative: String(existing.sessionNarrative ?? ""),
        interventions: String(existing.interventionsApplied ?? ""),
        followUp: String(existing.followUpActions ?? ""),
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to open recording editor.");
    }
  };

  const confirmDeleteRecording = async (): Promise<boolean> => {
    if (!deleteTargetId) return false;
    const id = deleteTargetId;
    try {
      const res = await apiFetch(`${API_PREFIX}/recordings/${id}?confirm=true`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      if (selectedEntryId === id) setSheetOpen(false);
      toast.success("Recording deleted.");
      await loadSessions(page);
      return true;
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete recording.");
      return false;
    }
  };

  const deleteDetailLines = useMemo(() => {
    if (!deleteTargetId) return undefined;
    const entry = sessions.find((s) => s.id === deleteTargetId);
    const lines: { label: string; value: string }[] = [{ label: "Recording ID", value: deleteTargetId }];
    if (entry?.residentDisplayName?.trim()) {
      lines.push({ label: "Resident", value: entry.residentDisplayName });
    }
    return lines;
  }, [deleteTargetId, sessions]);

  const handleSaveEditor = async () => {
    const emotionalMap: Record<EmotionalTag, string> = {
      Stable: "Calm",
      Anxious: "Anxious",
      Hopeful: "Hopeful",
      Distressed: "Distressed",
      Resilient: "Happy",
      Withdrawn: "Withdrawn",
    };
    const durationParsed = editor.durationMinutes.trim() === "" ? null : Number(editor.durationMinutes);
    if (!editor.residentId || !editor.date || !editor.worker.trim() || !editor.narrative.trim()) {
      toast.error("Resident, date, worker, and narrative are required.");
      return;
    }
    if (durationParsed != null && Number.isNaN(durationParsed)) {
      toast.error("Duration must be numeric.");
      return;
    }
    const body = {
      recordingId: editor.recordingId ? Number(editor.recordingId) : 0,
      residentId: parseInt(editor.residentId, 10),
      sessionDate: editor.date,
      socialWorker: editor.worker.trim(),
      sessionType: editor.sessionType,
      sessionDurationMinutes: durationParsed,
      emotionalStateObserved: emotionalMap[editor.emotionalState] ?? "Calm",
      sessionNarrative: editor.narrative.trim(),
      interventionsApplied: editor.interventions.trim() || null,
      followUpActions: editor.followUp.trim() || null,
      progressNoted: false,
      concernsFlagged: false,
      referralMade: false,
    };
    try {
      const res = editor.mode === "edit" && editor.recordingId
        ? await apiFetch(`${API_PREFIX}/recordings/${editor.recordingId}`, { method: "PUT", body: JSON.stringify(body) })
        : await apiFetch(`${API_PREFIX}/recordings`, { method: "POST", body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());

      const resident = residents.find((r) => r.id === editor.residentId);
      const nextEntry: ProcessSessionEntry = {
        id: editor.recordingId ?? String(Date.now()),
        residentId: editor.residentId,
        residentDisplayName: resident?.displayName ?? `Resident #${editor.residentId}`,
        caseId: resident?.caseId ?? `R-${editor.residentId}`,
        date: editor.date,
        worker: editor.worker.trim(),
        sessionType: editor.sessionType,
        durationMinutes: durationParsed,
        emotionalState: editor.emotionalState,
        narrativePreview: editor.narrative.trim(),
        emotionalObserved: emotionalMap[editor.emotionalState] ?? "Calm",
        narrativeFull: editor.narrative.trim(),
        interventions: editor.interventions.trim() || "—",
        followUp: editor.followUp.trim() || "—",
      };

      if (editor.mode === "edit" && editor.recordingId) {
        setSessions((prev) => prev.map((s) => (s.id === editor.recordingId ? { ...s, ...nextEntry } : s)));
        if (selectedEntryId === editor.recordingId) setDetailEntry((d) => (d ? { ...d, ...nextEntry } : nextEntry));
        toast.success("Recording updated.");
      } else {
        // Newest-first timeline: after creating, jump back to page 1 and refetch.
        toast.success("Session entry saved.");
        setPage(1);
        await loadSessions(1);
      }
      setEditor((e) => ({ ...e, open: false }));
    } catch (e) {
      toast.error("Failed to save session: " + (e instanceof Error ? e.message : "Unknown error"));
    }
  };

  const handleChangePage = (nextPage: number) => {
    const clamped = Math.min(Math.max(1, nextPage), totalPages);
    if (clamped === page) return;
    setPage(clamped);
    requestAnimationFrame(() => {
      timelineTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <AdminLayout contentClassName={DASHBOARD_CONTENT_MAX_WIDTH}>
      <StaffPageShell
        title="Process Recording"
        description="Document and review resident counseling sessions."
        actions={
          <>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                onClick={openCreateEditor}
                className="relative h-12 overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-r from-[hsl(340_44%_66%)] via-[hsl(350_40%_70%)] to-[hsl(10_44%_56%)] px-6 font-body font-semibold text-white shadow-[0_8px_32px_rgba(190,100,130,0.3)]"
              >
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/22 to-transparent opacity-90" />
                <span className="relative z-[1] flex items-center">
                  <Plus className="mr-2 h-4 w-4" strokeWidth={2.25} />
                  New Entry
                </span>
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
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="mb-6 max-w-xl"
        >
          {loadingResidents ? (
            <Skeleton className="h-[120px] rounded-[1.15rem] bg-white/45" />
          ) : (
            <ResidentSelector residents={residents} value={residentFilter} onChange={setResidentFilter} />
          )}
        </motion.section>

        <section className="relative">
          <div ref={timelineTopRef} />
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                Session timeline
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
                Chronological record
              </h2>
              <p className="mt-2 font-body text-sm text-muted-foreground">
                {total} {total === 1 ? "entry" : "entries"} — newest first
              </p>
            </div>
          </div>

          {loadingSessions ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[132px] rounded-[1.1rem] bg-white/40" />
              ))}
            </div>
          ) : (
            <>
              <SessionTimeline
                entries={filteredSessions}
                onSelect={openEntry}
                onEdit={(id) => void handleEditEntry(id)}
                onDelete={(id) => setDeleteTargetId(id)}
              />

              <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={page <= 1}
                  onClick={() => handleChangePage(page - 1)}
                >
                  Previous
                </Button>
                <p className="font-body text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={page >= totalPages}
                  onClick={() => handleChangePage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </section>
      </StaffPageShell>

      <SlideOverPanel
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        className="sm:max-w-[min(100%,26rem)] lg:max-w-[min(100%,34rem)]"
      >
        {detailEntry && <SessionEntrySheet entry={detailEntry} />}
      </SlideOverPanel>

      <motion.button
        type="button"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={openCreateEditor}
        className="fixed bottom-8 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(340_42%_68%)] to-[hsl(10_46%_56%)] text-white shadow-[0_14px_44px_rgba(190,100,130,0.4)] lg:bottom-10 lg:right-10"
        aria-label="New session entry"
      >
        <Plus className="h-6 w-6" strokeWidth={2} />
      </motion.button>

      <ConfirmDeleteModal
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        detailLines={deleteDetailLines}
        onConfirm={confirmDeleteRecording}
      />

      <Dialog open={editor.open} onOpenChange={(open) => setEditor((e) => ({ ...e, open }))}>
        <DialogContent className="max-h-[90vh] max-w-[min(100%,34rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-semibold">
              {editor.mode === "edit" ? "Edit recording" : "New recording"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label className="font-body text-xs">Resident</Label>
              <Select value={editor.residentId} onValueChange={(v) => setEditor((e) => ({ ...e, residentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select resident" /></SelectTrigger>
                <SelectContent>
                  {residents.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.displayName} ({r.caseId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="font-body text-xs">Session Type</Label>
              <Select value={editor.sessionType} onValueChange={(v) => setEditor((e) => ({ ...e, sessionType: v as SessionType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="font-body text-xs">Duration (minutes)</Label>
              <Input
                type="number"
                value={editor.durationMinutes}
                onChange={(e) => setEditor((ed) => ({ ...ed, durationMinutes: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="font-body text-xs">Date</Label>
              <Input
                type="date"
                value={editor.date}
                onChange={(e) => setEditor((ed) => ({ ...ed, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="font-body text-xs">Status / Emotional tag</Label>
              <Select value={editor.emotionalState} onValueChange={(v) => setEditor((e) => ({ ...e, emotionalState: v as EmotionalTag }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stable">Stable</SelectItem>
                  <SelectItem value="Anxious">Anxious</SelectItem>
                  <SelectItem value="Hopeful">Hopeful</SelectItem>
                  <SelectItem value="Distressed">Distressed</SelectItem>
                  <SelectItem value="Resilient">Resilient</SelectItem>
                  <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="font-body text-xs">Social worker</Label>
              <Input
                value={editor.worker}
                onChange={(e) => setEditor((ed) => ({ ...ed, worker: e.target.value }))}
                placeholder="SW-01"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="font-body text-xs">Narrative</Label>
              <Textarea
                className="min-h-[120px]"
                value={editor.narrative}
                onChange={(e) => setEditor((ed) => ({ ...ed, narrative: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="font-body text-xs">Interventions</Label>
              <Textarea
                className="min-h-[72px]"
                value={editor.interventions}
                onChange={(e) => setEditor((ed) => ({ ...ed, interventions: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="font-body text-xs">Follow-up actions</Label>
              <Textarea
                className="min-h-[72px]"
                value={editor.followUp}
                onChange={(e) => setEditor((ed) => ({ ...ed, followUp: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setEditor((e) => ({ ...e, open: false }))}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSaveEditor()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default RecordingsPage;
