import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EmotionalTag, ProcessSessionEntry, SessionType } from "@/lib/processRecordingMockData";
import { socialWorkers } from "@/lib/caseloadMockData";
import { processResidents } from "@/lib/processRecordingMockData";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const emotions: EmotionalTag[] = ["Stable", "Anxious", "Hopeful", "Distressed", "Resilient", "Withdrawn"];

type AddSessionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultResidentId?: string | "all";
  onSave: (entry: Omit<ProcessSessionEntry, "id"> & { id?: string }) => void;
};

export function AddSessionDialog({ open, onOpenChange, defaultResidentId, onSave }: AddSessionDialogProps) {
  const [residentId, setResidentId] = useState(processResidents[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [worker, setWorker] = useState(socialWorkers[0]);
  const [sessionType, setSessionType] = useState<SessionType>("Individual");
  const [emotional, setEmotional] = useState<EmotionalTag>("Stable");
  const [narrative, setNarrative] = useState("");
  const [interventions, setInterventions] = useState("");
  const [followUp, setFollowUp] = useState("");

  useEffect(() => {
    if (open) {
      if (defaultResidentId && defaultResidentId !== "all") setResidentId(defaultResidentId);
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [open, defaultResidentId]);

  const handleSave = () => {
    const preview = narrative.trim().slice(0, 160) + (narrative.length > 160 ? "…" : "");
    onSave({
      residentId,
      date,
      worker,
      sessionType,
      emotionalState: emotional,
      narrativePreview: preview || "Session documented.",
      emotionalObserved: "Recorded during intake of session notes.",
      narrativeFull: narrative.trim() || "—",
      interventions: interventions.trim() || "—",
      followUp: followUp.trim() || "—",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[min(100%,32rem)] overflow-y-auto rounded-[1.25rem] border-0 bg-[hsl(36_32%_97%)] p-0 dark:bg-[hsl(213_40%_10%)]">
        <div className="border-b border-white/50 px-6 pb-4 pt-6 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-semibold tracking-tight">New session entry</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">
              Capture a calm, complete record. You can edit in the clinical system later if needed.
            </DialogDescription>
          </DialogHeader>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 px-6 py-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label className="font-body text-xs">Resident</Label>
              <Select value={residentId} onValueChange={setResidentId}>
                <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {processResidents.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.displayName} ({r.caseId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sd" className="font-body text-xs">
                Date
              </Label>
              <Input
                id="sd"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-xs">Social worker</Label>
              <Select value={worker} onValueChange={setWorker}>
                <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {socialWorkers.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-body text-xs">Session type</Label>
              <Select value={sessionType} onValueChange={(v) => setSessionType(v as SessionType)}>
                <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-body text-xs">Emotional state</Label>
              <Select value={emotional} onValueChange={(v) => setEmotional(v as EmotionalTag)}>
                <SelectTrigger className="rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {emotions.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nar" className="font-body text-xs">
                Narrative summary
              </Label>
              <Textarea
                id="nar"
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="What happened in session — strengths, risks, resident voice."
                className="min-h-[140px] rounded-xl border-white/60 bg-white/70 font-body text-sm leading-relaxed dark:border-white/10 dark:bg-white/10"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="int" className="font-body text-xs">
                Interventions
              </Label>
              <Textarea
                id="int"
                value={interventions}
                onChange={(e) => setInterventions(e.target.value)}
                className="min-h-[88px] rounded-xl border-white/60 bg-white/70 font-body text-sm dark:border-white/10 dark:bg-white/10"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="fu" className="font-body text-xs">
                Follow-up actions
              </Label>
              <Textarea
                id="fu"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                className="min-h-[88px] rounded-xl border-white/60 bg-white/70 font-body text-sm dark:border-white/10 dark:bg-white/10"
              />
            </div>
          </div>
        </motion.div>

        <DialogFooter className="border-t border-white/50 px-6 py-4 dark:border-white/10">
          <Button type="button" variant="ghost" className="rounded-xl font-body" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-xl bg-gradient-to-r from-[hsl(340_44%_62%)] to-[hsl(10_42%_56%)] font-body font-semibold text-white shadow-md"
            onClick={handleSave}
          >
            Save entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
