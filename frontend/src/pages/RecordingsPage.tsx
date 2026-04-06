import { AdminLayout } from "@/components/AdminLayout";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { AddSessionDialog, ResidentSelector, SessionEntrySheet, SessionTimeline } from "@/components/processRecording";
import { SlideOverPanel } from "@/components/donors/SlideOverPanel";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { delay } from "@/lib/mockData";
import {
  initialProcessSessions,
  processResidents,
  type ProcessSessionEntry,
} from "@/lib/processRecordingMockData";
import { motion } from "framer-motion";
import { PenLine, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const RecordingsPage = () => {
  usePageHeader("Process Recordings", "Clinical session documentation");

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ProcessSessionEntry[]>(initialProcessSessions);
  const [residentFilter, setResidentFilter] = useState<string | "all">("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    delay(640).then(() => setLoading(false));
  }, []);

  const filteredSessions = useMemo(() => {
    const list =
      residentFilter === "all" ? sessions : sessions.filter((s) => s.residentId === residentFilter);
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions, residentFilter]);

  const selectedEntry = useMemo(
    () => sessions.find((s) => s.id === selectedEntryId) ?? null,
    [sessions, selectedEntryId]
  );

  const openEntry = (id: string) => {
    setSelectedEntryId(id);
    setSheetOpen(true);
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
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="mb-10 max-w-xl"
        >
          {loading ? (
            <Skeleton className="h-[120px] rounded-[1.15rem] bg-white/45" />
          ) : (
            <ResidentSelector residents={processResidents} value={residentFilter} onChange={setResidentFilter} />
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
            <SessionTimeline entries={filteredSessions} onSelect={openEntry} />
          )}
        </section>
      </StaffPageShell>

      <SlideOverPanel
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        className="sm:max-w-[min(100%,26rem)] lg:max-w-[min(100%,34rem)]"
      >
        {selectedEntry && <SessionEntrySheet entry={selectedEntry} />}
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
        onSave={(payload) => {
          const id = `PR-${Date.now().toString().slice(-6)}`;
          const full: ProcessSessionEntry = {
            id,
            residentId: payload.residentId,
            date: payload.date,
            worker: payload.worker,
            sessionType: payload.sessionType,
            emotionalState: payload.emotionalState,
            narrativePreview: payload.narrativePreview,
            emotionalObserved: payload.emotionalObserved,
            narrativeFull: payload.narrativeFull,
            interventions: payload.interventions,
            followUp: payload.followUp,
          };
          setSessions((prev) => [full, ...prev]);
          toast.success("Session saved", { description: "Entry added to the timeline (demo)." });
        }}
      />
    </AdminLayout>
  );
};

export default RecordingsPage;
