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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ContributionKind } from "@/lib/donorsContributionsMockData";
import { programAreas, safehouses, supporters } from "@/lib/donorsContributionsMockData";
import { useState } from "react";
import { toast } from "sonner";

type AddContributionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (payload: {
    supporterId: string;
    kind: ContributionKind;
    amount: string;
    hours: string;
    description: string;
    safehouse: string;
    program: string;
  }) => void;
};

const kinds: { value: ContributionKind; label: string }[] = [
  { value: "monetary", label: "Monetary" },
  { value: "volunteer", label: "Volunteer (hours)" },
  { value: "skills", label: "Skills / pro bono" },
  { value: "in-kind", label: "In-kind" },
  { value: "social", label: "Social / advocacy" },
];

export function AddContributionDialog({ open, onOpenChange, onSubmit }: AddContributionDialogProps) {
  const [supporterId, setSupporterId] = useState(supporters[0]?.id ?? "");
  const [kind, setKind] = useState<ContributionKind>("monetary");
  const [amount, setAmount] = useState("");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [safehouse, setSafehouse] = useState(safehouses[0] ?? "");
  const [program, setProgram] = useState(programAreas[0] ?? "");

  const reset = () => {
    setSupporterId(supporters[0]?.id ?? "");
    setKind("monetary");
    setAmount("");
    setHours("");
    setDescription("");
    setSafehouse(safehouses[0] ?? "");
    setProgram(programAreas[0] ?? "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      supporterId,
      kind,
      amount,
      hours,
      description,
      safehouse,
      program,
    });
    toast.success("Contribution recorded", {
      description: `${supporters.find((s) => s.id === supporterId)?.name ?? "Supporter"} — ${kind}`,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-0 bg-[hsl(36_33%_98%)]/95 p-0 shadow-[0_24px_80px_rgba(45,35,48,0.12)] backdrop-blur-xl dark:bg-[hsl(213_45%_10%)]/95 sm:rounded-[1.35rem]">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-white/60 px-6 pb-4 pt-6 dark:border-white/5">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-semibold tracking-tight">Log a contribution</DialogTitle>
              <DialogDescription className="font-body text-sm text-muted-foreground">
                Tie activity to a supporter and where it supports mission delivery.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-6 py-6">
            <div className="space-y-2">
              <Label className="font-body text-xs font-medium text-muted-foreground">Supporter</Label>
              <Select value={supporterId} onValueChange={setSupporterId}>
                <SelectTrigger className="h-11 rounded-xl border-0 bg-white/70 font-body shadow-inner dark:bg-white/5">
                  <SelectValue placeholder="Choose supporter" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {supporters.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="font-body">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-body text-xs font-medium text-muted-foreground">Contribution type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as ContributionKind)}>
                <SelectTrigger className="h-11 rounded-xl border-0 bg-white/70 font-body shadow-inner dark:bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {kinds.map((k) => (
                    <SelectItem key={k.value} value={k.value} className="font-body">
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="font-body text-xs font-medium text-muted-foreground">Amount ($)</Label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="h-11 rounded-xl border-0 bg-white/70 font-body tabular-nums shadow-inner dark:bg-white/5"
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-xs font-medium text-muted-foreground">Hours</Label>
                <Input
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="0"
                  className="h-11 rounded-xl border-0 bg-white/70 font-body tabular-nums shadow-inner dark:bg-white/5"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-body text-xs font-medium text-muted-foreground">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief note for the record…"
                rows={3}
                className="resize-none rounded-xl border-0 bg-white/70 font-body shadow-inner dark:bg-white/5"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="font-body text-xs font-medium text-muted-foreground">Safehouse</Label>
                <Select value={safehouse} onValueChange={setSafehouse}>
                  <SelectTrigger className="h-11 rounded-xl border-0 bg-white/70 font-body shadow-inner dark:bg-white/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {safehouses.map((sh) => (
                      <SelectItem key={sh} value={sh} className="font-body">
                        {sh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-body text-xs font-medium text-muted-foreground">Program area</Label>
                <Select value={program} onValueChange={setProgram}>
                  <SelectTrigger className="h-11 rounded-xl border-0 bg-white/70 font-body shadow-inner dark:bg-white/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {programAreas.map((p) => (
                      <SelectItem key={p} value={p} className="font-body">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-white/60 px-6 py-4 dark:border-white/5 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl font-body"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-[hsl(340_42%_72%)] to-[hsl(10_48%_62%)] px-6 font-body font-medium text-white shadow-sm transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Save contribution
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
