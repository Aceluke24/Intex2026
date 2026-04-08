import { AdminLayout } from "@/components/AdminLayout";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { AddSessionDialog, ResidentSelector, SessionEntrySheet, SessionTimeline } from "@/components/processRecording";
import { SlideOverPanel } from "@/components/donors/SlideOverPanel";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
import {
  mapApiEmotionalState,
  type ProcessResidentOption,
  type ProcessSessionEntry,
  type SessionType,
} from "@/lib/processRecordingTypes";
import { motion } from "framer-motion";
import { PenLine, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
    emotionalState: mapApiEmotionalState(item.emotionalState || ""),
    narrativePreview: note,
    emotionalObserved: item.emotionalState?.trim() || "—",
    narrativeFull: note,
    interventions: "—",
    followUp: "—",
  };
}

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
  usePageHeader("Process Recordings", "Clinical session documentation");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ProcessSessionEntry[]>([]);
  const [residents, setResidents] = useState<ProcessResidentOption[]>([]);
  const [residentFilter, setResidentFilter] = useState<string | "all">("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [detailEntry, setDetailEntry] = useState<ProcessSessionEntry | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [recRes, resRes] = await Promise.all([
        apiFetchJson<RecordingListResponse>(`${API_PREFIX}/recordings?page=1&pageSize=100`),
        apiFetchJson<ResidentsResponse>(`${API_PREFIX}/residents?page=1&pageSize=500`),
      ]);
      setSessions(recRes.items.map(mapListItemToEntry));
      setResidents(resRes.items.map(mapResident));
    } catch (e) {
      console.error(e);
      setLoadError(e instanceof Error ? e.message : "Failed to load recordings.");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
    const list =
      residentFilter === "all" ? sessions : sessions.filter((s) => s.residentId === residentFilter);
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions, residentFilter]);

  const openEntry = (id: string) => {
    setSelectedEntryId(id);
    setSheetOpen(true);
  };

  const handleEditEntry = async (id: string) => {
    try {
      const existing = await apiFetchJson<Record<string, unknown>>(`${API_PREFIX}/recordings/${id}`);
      const currentNarrative = String(existing.sessionNarrative ?? "");
      const nextNarrative = window.prompt("Update session narrative", currentNarrative);
      if (nextNarrative == null) return;
      const body = { ...existing, recordingId: Number(id), sessionNarrative: nextNarrative.trim() || null };
      const res = await apiFetch(`${API_PREFIX}/recordings/${id}`, { method: "PUT", body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Recording updated.");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to update recording.");
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm(`Delete recording ${id}?`)) return;
    try {
      const res = await apiFetch(`${API_PREFIX}/recordings/${id}?confirm=true`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      if (selectedEntryId === id) setSheetOpen(false);
      toast.success("Recording deleted.");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete recording.");
    }
  };

  return (
    <AdminLayout contentClassName="max-w-[min(100%,90rem)]">
      <StaffPageShell
        tone="quiet"
        eyebrow="Clinical documentation"
        eyebrowIcon={<PenLine className="h-3.5 w-3.5 text-[hsl(340_38%_52%)]" strokeWidth={1.5} />}
        title="Process Recording"
        description="Document and review resident counseling sessions."
        actions={
          <>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                onClick={() => setAddOpen(true)}
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
          className="mb-10 max-w-xl"
        >
          {loading ? (
            <Skeleton className="h-[120px] rounded-[1.15rem] bg-white/45" />
          ) : (
            <ResidentSelector residents={residents} value={residentFilter} onChange={setResidentFilter} />
          )}
        </motion.section>

        <section className="relative">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                Session timeline
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
                Chronological record
              </h2>
              <p className="mt-2 font-body text-sm text-muted-foreground">
                {filteredSessions.length} {filteredSessions.length === 1 ? "entry" : "entries"} — newest first
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[132px] rounded-[1.1rem] bg-white/40" />
              ))}
            </div>
          ) : (
            <SessionTimeline
              entries={filteredSessions}
              onSelect={openEntry}
              onEdit={(id) => void handleEditEntry(id)}
              onDelete={(id) => void handleDeleteEntry(id)}
            />
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
        onClick={() => setAddOpen(true)}
        className="fixed bottom-8 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(340_42%_68%)] to-[hsl(10_46%_56%)] text-white shadow-[0_14px_44px_rgba(190,100,130,0.4)] lg:bottom-10 lg:right-10"
        aria-label="New session entry"
      >
        <Plus className="h-6 w-6" strokeWidth={2} />
      </motion.button>

      <AddSessionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultResidentId={residentFilter}
        residents={residents}
        workerOptions={workersForDialog}
        onSave={async (entry) => {
          // Map UI emotional state back to API values
          const emotionalMap: Record<string, string> = {
            Stable: "Calm",
            Anxious: "Anxious",
            Hopeful: "Hopeful",
            Distressed: "Distressed",
            Resilient: "Happy",
            Withdrawn: "Withdrawn",
          };
          const body = {
            residentId: parseInt(entry.residentId, 10),
            sessionDate: entry.date,
            socialWorker: entry.worker,
            sessionType: entry.sessionType,
            emotionalStateObserved: emotionalMap[entry.emotionalState] ?? "Calm",
            sessionNarrative: entry.narrativeFull !== "—" ? entry.narrativeFull : null,
            interventionsApplied: entry.interventions !== "—" ? entry.interventions : null,
            followUpActions: entry.followUp !== "—" ? entry.followUp : null,
            progressNoted: false,
            concernsFlagged: false,
            referralMade: false,
          };
          try {
            const res = await apiFetch(`${API_PREFIX}/recordings`, {
              method: "POST",
              body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(await res.text());
            toast.success("Session entry saved.");
            void load();
          } catch (e) {
            toast.error("Failed to save session: " + (e instanceof Error ? e.message : "Unknown error"));
          }
        }}
      />
    </AdminLayout>
  );
};

export default RecordingsPage;
