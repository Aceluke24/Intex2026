import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ProcessResidentOption } from "@/lib/processRecordingMockData";
import { motion } from "framer-motion";
import { Check, ChevronsUpDown, Users } from "lucide-react";
import { useState } from "react";

type ResidentSelectorProps = {
  residents: ProcessResidentOption[];
  value: string | "all";
  onChange: (id: string | "all") => void;
};

export function ResidentSelector({ residents, value, onChange }: ResidentSelectorProps) {
  const [open, setOpen] = useState(false);

  const selected =
    value === "all"
      ? null
      : residents.find((r) => r.id === value) ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className={cn(
        "rounded-[1.15rem] border border-white/55 bg-white/45 p-4 shadow-[0_8px_36px_rgba(45,35,48,0.06)] backdrop-blur-xl",
        "dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_8px_36px_rgba(0,0,0,0.35)]"
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-muted-foreground/80">
        <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span className="font-body text-[10px] font-semibold uppercase tracking-[0.18em]">Resident context</span>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-12 w-full justify-between rounded-xl border-white/60 bg-white/70 font-body font-normal shadow-inner backdrop-blur-sm hover:bg-white/90 dark:border-white/12 dark:bg-white/10 dark:hover:bg-white/[0.14]"
          >
            {selected ? (
              <span className="flex min-w-0 flex-col items-start text-left">
                <span className="truncate font-medium text-foreground">{selected.displayName}</span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {selected.caseId} · {selected.category}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">All residents (chronological)</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,400px)] rounded-xl border-white/60 bg-[hsl(36_32%_98%)]/95 p-0 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[hsl(213_38%_12%)]/95" align="start">
          <Command className="rounded-xl bg-transparent">
            <CommandInput placeholder="Search name or case ID…" className="font-body text-sm" />
            <CommandList>
              <CommandEmpty className="py-6 text-center font-body text-sm text-muted-foreground">
                No resident matches.
              </CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all-residents"
                  onSelect={() => {
                    onChange("all");
                    setOpen(false);
                  }}
                  className="rounded-lg font-body text-sm"
                >
                  <Check className={cn("mr-2 h-4 w-4", value === "all" ? "opacity-100" : "opacity-0")} />
                  All residents
                </CommandItem>
                {residents.map((r) => (
                  <CommandItem
                    key={r.id}
                    value={`${r.displayName} ${r.caseId} ${r.category}`}
                    onSelect={() => {
                      onChange(r.id);
                      setOpen(false);
                    }}
                    className="rounded-lg font-body text-sm"
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === r.id ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col">
                      <span>{r.displayName}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {r.caseId} · {r.category}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </motion.div>
  );
}
