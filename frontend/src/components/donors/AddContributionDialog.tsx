import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ContributionKind } from "@/lib/donorsTypes";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";

const DEFAULT_PROGRAMS = ["General operations", "Safe housing", "Counseling", "Education", "Outreach"];

/** Brand-adjacent focus; avoids default terracotta ring on selects */
const FIELD_FOCUS =
  "focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-[#E8AEB7]/45 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#E8AEB7]/45 focus-visible:ring-offset-0";

const SELECT_TRIGGER_CLASS = cn(
  "flex h-11 w-full items-center justify-between rounded-[14px] border border-[hsl(36_18%_86%)] bg-[hsl(36_32%_99%)] px-3.5 py-2 text-sm font-body text-foreground shadow-[inset_0_1px_2px_rgba(45,35,48,0.04)] transition-[box-shadow,border-color,background-color] duration-200 ease-out",
  "dark:border-[hsl(213_28%_22%)] dark:bg-[hsl(213_32%_13%)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.22)]",
  "data-[placeholder]:text-muted-foreground [&>span]:line-clamp-1",
  "disabled:cursor-not-allowed disabled:opacity-45",
  FIELD_FOCUS,
  "focus:border-[#E8AEB7]/55",
);

const SELECT_CONTENT_CLASS = cn(
  "z-50 max-h-96 overflow-hidden rounded-[14px] border border-[hsl(36_18%_86%)] bg-[hsl(36_32%_99%)] p-1 text-popover-foreground shadow-[0_16px_48px_rgba(45,35,48,0.12)] backdrop-blur-xl",
  "dark:border-[hsl(213_28%_22%)] dark:bg-[hsl(213_32%_13%)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.45)]",
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
);

const SELECT_ITEM_CLASS =
  "cursor-pointer rounded-[10px] py-2.5 pl-8 pr-2 font-body text-sm outline-none focus:bg-[#E8AEB7]/16 focus:text-foreground data-[highlighted]:bg-[#E8AEB7]/16 data-[highlighted]:text-foreground";

const INPUT_FIELD_CLASS = cn(
  "h-11 rounded-[14px] border border-[hsl(36_18%_86%)] bg-[hsl(36_32%_99%)] px-3.5 py-2 text-sm font-body tabular-nums shadow-[inset_0_1px_2px_rgba(45,35,48,0.04)] transition-[box-shadow,border-color,background-color] duration-200 ease-out",
  "dark:border-[hsl(213_28%_22%)] dark:bg-[hsl(213_32%_13%)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.22)]",
  FIELD_FOCUS,
  "focus-visible:border-[#E8AEB7]/55",
);

const TEXTAREA_FIELD_CLASS = cn(
  "min-h-[96px] resize-none rounded-[14px] border border-[hsl(36_18%_86%)] bg-[hsl(36_32%_99%)] px-3.5 py-3 text-sm font-body shadow-[inset_0_1px_2px_rgba(45,35,48,0.04)] transition-[box-shadow,border-color,background-color] duration-200 ease-out",
  "dark:border-[hsl(213_28%_22%)] dark:bg-[hsl(213_32%_13%)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.22)]",
  FIELD_FOCUS,
  "focus-visible:border-[#E8AEB7]/55",
);

const LABEL_CLASS = "mb-1.5 block font-body text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground";

type AddContributionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supporterOptions: { id: string; name: string }[];
  safehouses: string[];
  programAreas?: string[];
  onSubmit?: (payload: {
    supporterId: string;
    kind: ContributionKind;
    amount: string;
    hours: string;
    description: string;
    safehouse: string;
    program: string;
  }) => void | Promise<void>;
};

const kinds: { value: ContributionKind; label: string }[] = [
  { value: "monetary", label: "Monetary" },
  { value: "volunteer", label: "Volunteer (hours)" },
  { value: "skills", label: "Skills / pro bono" },
  { value: "in-kind", label: "In-kind" },
  { value: "social", label: "Social / advocacy" },
];

export function AddContributionDialog({
  open,
  onOpenChange,
  supporterOptions,
  safehouses,
  programAreas = DEFAULT_PROGRAMS,
  onSubmit,
}: AddContributionDialogProps) {
  const [supporterId, setSupporterId] = useState("");
  const [supporterOpen, setSupporterOpen] = useState(false);
  const [kind, setKind] = useState<ContributionKind>("monetary");
  const [amount, setAmount] = useState("");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [safehouse, setSafehouse] = useState("");
  const [program, setProgram] = useState(programAreas[0] ?? DEFAULT_PROGRAMS[0]);

  const selectedSupporter = supporterOptions.find((s) => s.id === supporterId);

  useEffect(() => {
    if (!open) return;
    const firstS = supporterOptions[0]?.id ?? "";
    const firstSh = safehouses[0] ?? "";
    const firstP = programAreas[0] ?? DEFAULT_PROGRAMS[0];
    setSupporterId(firstS);
    setSafehouse(firstSh);
    setProgram(firstP);
  }, [open, supporterOptions, safehouses, programAreas]);

  useEffect(() => {
    if (kind === "monetary") setHours("");
    if (kind === "volunteer") setAmount("");
  }, [kind]);

  const reset = () => {
    setSupporterId(supporterOptions[0]?.id ?? "");
    setKind("monetary");
    setAmount("");
    setHours("");
    setDescription("");
    setSafehouse(safehouses[0] ?? "");
    setProgram(programAreas[0] ?? DEFAULT_PROGRAMS[0]);
    setSupporterOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit?.({
        supporterId,
        kind,
        amount: kind === "volunteer" ? "" : amount,
        hours: kind === "monetary" ? "" : hours,
        description,
        safehouse,
        program,
      });
      reset();
      onOpenChange(false);
    } catch {
      // Caller handles toast messaging; keep dialog open so user can fix input.
    }
  };

  const showAmount = kind !== "volunteer";
  const showHours = kind !== "monetary";
  const metricsTwoColumn = showAmount && showHours;

  const supporterTriggerClass = cn(
    SELECT_TRIGGER_CLASS,
    "font-normal",
    !selectedSupporter && "text-muted-foreground",
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName={cn(
          "fixed inset-0 z-50 bg-[hsl(213_35%_18%)]/35 backdrop-blur-[6px]",
          "dark:bg-[hsl(213_55%_5%)]/50",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        )}
        className={cn(
          "max-h-[min(92vh,840px)] w-full max-w-[min(100vw-1.5rem,560px)] gap-0 overflow-y-auto border-0 bg-[hsl(36_33%_98%)]/96 p-0 shadow-[0_28px_90px_rgba(45,35,48,0.14)] backdrop-blur-xl duration-300 ease-out",
          "dark:bg-[hsl(213_42%_11%)]/96 dark:shadow-[0_28px_90px_rgba(0,0,0,0.55)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-[1.25rem]",
        )}
      >
        <form onSubmit={handleSubmit}>
          <div className="border-b border-[hsl(36_20%_90%)]/80 px-6 pb-5 pt-7 dark:border-white/[0.07] sm:px-7">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="font-display text-[1.35rem] font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
                Log a contribution
              </DialogTitle>
              <DialogDescription className="font-body text-[0.9375rem] leading-relaxed text-muted-foreground/85">
                Tie activity to a supporter and where it supports mission delivery.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-5 px-6 py-7 sm:px-7">
            <div className="grid gap-1">
              <Label htmlFor="supporter-trigger" className={LABEL_CLASS}>
                Supporter
              </Label>
              <Popover open={supporterOpen} onOpenChange={setSupporterOpen}>
                <PopoverTrigger asChild>
                  <button
                    id="supporter-trigger"
                    type="button"
                    role="combobox"
                    aria-expanded={supporterOpen}
                    aria-haspopup="listbox"
                    disabled={supporterOptions.length === 0}
                    className={cn(
                      supporterTriggerClass,
                      "inline-flex justify-between font-body transition-[transform,background-color,box-shadow] duration-200 ease-out",
                      "hover:bg-[hsl(36_30%_97%)] active:scale-[0.995] dark:hover:bg-[hsl(213_30%_15%)]",
                      "disabled:pointer-events-none disabled:opacity-45",
                    )}
                  >
                    <span className="truncate">{selectedSupporter?.name ?? "Choose supporter"}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-45" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className={cn(
                    "w-[var(--radix-popover-trigger-width)] max-w-[min(100vw-2rem,520px)] rounded-[14px] border border-[hsl(36_18%_86%)] bg-[hsl(36_32%_99%)]/98 p-0 shadow-[0_20px_56px_rgba(45,35,48,0.14)] backdrop-blur-xl",
                    "dark:border-[hsl(213_28%_22%)] dark:bg-[hsl(213_32%_13%)]/98 dark:shadow-[0_20px_56px_rgba(0,0,0,0.5)]",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
                  )}
                  align="start"
                >
                  <Command className="rounded-[14px] bg-transparent" shouldFilter>
                    <CommandInput
                      placeholder="Search supporters…"
                      className="h-11 border-b border-[hsl(36_18%_88%)] font-body text-sm dark:border-white/10"
                    />
                    <CommandList className="max-h-[220px]">
                      <CommandEmpty className="py-8 text-center font-body text-sm text-muted-foreground">
                        No supporters match your search.
                      </CommandEmpty>
                      <CommandGroup className="p-1">
                        {supporterOptions.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={`${s.name} ${s.id}`}
                            onSelect={() => {
                              setSupporterId(s.id);
                              setSupporterOpen(false);
                            }}
                            className="rounded-[10px] font-body text-sm data-[selected=true]:bg-[#E8AEB7]/14 aria-selected:bg-[#E8AEB7]/14"
                          >
                            <Check
                              className={cn("mr-2 h-4 w-4 shrink-0", supporterId === s.id ? "opacity-100" : "opacity-0")}
                            />
                            {s.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {supporterOptions.length === 0 ? (
                <p className="mt-2 font-body text-xs text-muted-foreground/90">Add supporters before logging contributions.</p>
              ) : null}
            </div>

            <div className="grid gap-1">
              <Label className={LABEL_CLASS}>Contribution type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as ContributionKind)}>
                <SelectTrigger className={SELECT_TRIGGER_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={SELECT_CONTENT_CLASS}>
                  {kinds.map((k) => (
                    <SelectItem key={k.value} value={k.value} className={SELECT_ITEM_CLASS}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              className={cn(
                "grid gap-5",
                metricsTwoColumn ? "sm:grid-cols-2 sm:gap-x-5" : "grid-cols-1",
              )}
            >
              {showAmount && (
                <div className="grid gap-1">
                  <Label htmlFor="contrib-amount" className={LABEL_CLASS}>
                    Amount ($)
                  </Label>
                  <Input
                    id="contrib-amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className={INPUT_FIELD_CLASS}
                    inputMode="decimal"
                  />
                </div>
              )}
              {showHours && (
                <div className="grid gap-1">
                  <Label htmlFor="contrib-hours" className={LABEL_CLASS}>
                    Hours
                  </Label>
                  <Input
                    id="contrib-hours"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="0"
                    className={INPUT_FIELD_CLASS}
                    inputMode="decimal"
                  />
                </div>
              )}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="contrib-desc" className={LABEL_CLASS}>
                Description
              </Label>
              <Textarea
                id="contrib-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief note for the record…"
                rows={3}
                className={TEXTAREA_FIELD_CLASS}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2 sm:gap-x-5">
              <div className="grid gap-1">
                <Label className={LABEL_CLASS}>Safehouse</Label>
                <Select value={safehouse} onValueChange={setSafehouse}>
                  <SelectTrigger className={SELECT_TRIGGER_CLASS}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={SELECT_CONTENT_CLASS}>
                    {safehouses.map((sh) => (
                      <SelectItem key={sh} value={sh} className={SELECT_ITEM_CLASS}>
                        {sh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label className={LABEL_CLASS}>Program area</Label>
                <Select value={program} onValueChange={setProgram}>
                  <SelectTrigger className={SELECT_TRIGGER_CLASS}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={SELECT_CONTENT_CLASS}>
                    {programAreas.map((p) => (
                      <SelectItem key={p} value={p} className={SELECT_ITEM_CLASS}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 border-t border-[hsl(36_20%_90%)]/80 px-6 py-5 dark:border-white/[0.07] sm:justify-end sm:px-7">
            <Button
              type="button"
              variant="ghost"
              className={cn(
                "rounded-[12px] px-4 font-body text-sm font-medium text-muted-foreground",
                "transition-opacity duration-150 ease-out hover:bg-transparent hover:opacity-65 active:opacity-45",
              )}
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={cn(
                "rounded-[14px] px-7 font-body text-sm font-medium text-white shadow-[0_8px_24px_rgba(232,174,183,0.35)]",
                "bg-gradient-to-r from-[#E8AEB7] via-[hsl(345_42%_72%)] to-[hsl(10_48%_62%)]",
                "transition-[transform,box-shadow,filter] duration-200 ease-out",
                "hover:shadow-[0_12px_32px_rgba(232,174,183,0.42)] hover:brightness-[1.03]",
                "active:scale-[0.98] active:shadow-[0_4px_16px_rgba(232,174,183,0.28)]",
              )}
            >
              Save contribution
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
