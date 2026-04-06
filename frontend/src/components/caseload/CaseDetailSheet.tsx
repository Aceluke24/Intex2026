import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ResidentCase } from "@/lib/caseloadMockData";
import { reintegrationPhases } from "@/lib/caseloadMockData";
import { format } from "date-fns";
import { motion } from "framer-motion";
import type { ElementType } from "react";
import {
  Building2,
  Calendar,
  ClipboardList,
  HeartHandshake,
  MapPin,
  User,
  Users,
} from "lucide-react";

type CaseDetailSheetProps = {
  c: ResidentCase;
};

function yesNo(v: boolean) {
  return v ? "Yes" : "No";
}

function SectionTitle({ icon: Icon, children }: { icon: ElementType; children: React.ReactNode }) {
  return (
    <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.02em] text-foreground">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-foreground/55 shadow-sm dark:bg-white/10 dark:text-white/65">
        <Icon className="h-4 w-4" strokeWidth={1.5} />
      </span>
      {children}
    </h3>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">{label}</p>
      <p className="font-body text-sm leading-snug text-foreground/95">{value}</p>
    </div>
  );
}

export function CaseDetailSheet({ c }: CaseDetailSheetProps) {
  const phases = reintegrationPhases.map((label, i) => ({
    label,
    done: i < c.phaseIndex,
    current: i === c.phaseIndex,
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-white/50 px-6 pb-6 pt-8 dark:border-white/10">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-[11px] font-medium text-muted-foreground"
        >
          {c.id}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-2 font-display text-2xl font-bold tracking-[-0.03em] text-foreground"
        >
          Case file
        </motion.h2>
        <p className="mt-2 max-w-sm font-body text-sm leading-relaxed text-muted-foreground">
          Structured record for care coordination. Handle according to data protection policies.
        </p>
      </div>

      <ScrollArea className="flex-1 px-6">
        <div className="space-y-10 py-8 pb-28">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <SectionTitle icon={User}>Resident overview</SectionTitle>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Display name" value={c.displayName} />
              <Field label="Age / gender" value={`${c.age} · ${c.gender}`} />
              <Field label="Category" value={c.category} />
              <Field label="Subcategory" value={c.subcategory} />
              <Field label="Disability & accessibility" value={c.disability ?? "None recorded"} />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <SectionTitle icon={Users}>Family socio-demographic profile</SectionTitle>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="4Ps beneficiary" value={yesNo(c.socio.fourPsBeneficiary)} />
              <Field label="Solo parent household" value={yesNo(c.socio.soloParentHousehold)} />
              <Field
                label="Indigenous group"
                value={c.socio.indigenousGroup ?? "Not indicated"}
              />
              <Field label="Informal settler status" value={yesNo(c.socio.informalSettler)} />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            <SectionTitle icon={Calendar}>Admission & referral</SectionTitle>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Admission date" value={format(new Date(c.admissionDate), "MMMM d, yyyy")} />
              <Field label="Referral source" value={c.referralSource} />
              <Field label="Origin location" value={c.originLocation} />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SectionTitle icon={HeartHandshake}>Case assignment</SectionTitle>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Assigned social worker" value={c.assignedWorker} />
              <Field label="Safehouse" value={c.safehouse} />
            </div>
            <div className="mt-5 rounded-[1rem] bg-white/55 p-4 dark:bg-white/[0.06]">
              <p className="font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">
                Notes & updates
              </p>
              <p className="mt-2 font-body text-sm leading-relaxed text-foreground/90">{c.caseNotes}</p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
          >
            <SectionTitle icon={ClipboardList}>Reintegration tracking</SectionTitle>
            <div className="mb-6 flex flex-wrap gap-2">
              {phases.map((p) => (
                <div
                  key={p.label}
                  className={cn(
                    "rounded-full px-3 py-1 font-body text-[11px] font-semibold",
                    p.current &&
                      "bg-[hsl(340_30%_92%)] text-[hsl(340_32%_28%)] ring-1 ring-[hsl(340_35%_82%)] dark:bg-[hsl(340_22%_18%)] dark:text-[hsl(340_35%_88%)] dark:ring-[hsl(340_25%_28%)]",
                    p.done && !p.current && "bg-[hsl(150_22%_92%)] text-[hsl(150_25%_28%)] dark:bg-[hsl(150_18%_16%)] dark:text-[hsl(150_25%_78%)]",
                    !p.done && !p.current && "bg-secondary/80 text-muted-foreground"
                  )}
                >
                  {p.label}
                </div>
              ))}
            </div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-body text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/75">
                Overall progress
              </span>
              <span className="font-body text-xs tabular-nums text-muted-foreground">{c.reintegrationProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(210_16%_90%)] dark:bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[hsl(340_40%_68%)] to-[hsl(150_28%_50%)]"
                initial={{ width: 0 }}
                animate={{ width: `${c.reintegrationProgress}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            <div className="mt-8 space-y-4">
              <p className="flex items-center gap-2 font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75">
                <Building2 className="h-3.5 w-3.5 opacity-70" />
                Timeline of updates
              </p>
              <ul className="space-y-4">
                {c.timeline.map((t, i) => (
                  <li key={t.id} className="relative pl-5">
                    <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-[hsl(340_35%_72%)]/90" />
                    {i < c.timeline.length - 1 && (
                      <span className="absolute left-[3px] top-4 h-[calc(100%+8px)] w-px bg-border/60" aria-hidden />
                    )}
                    <p className="font-body text-[11px] tabular-nums text-muted-foreground">
                      {format(new Date(t.at), "MMM d, yyyy · h:mm a")}
                    </p>
                    <p className="mt-1 font-body text-sm text-foreground/90">{t.summary}</p>
                  </li>
                ))}
              </ul>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="rounded-[1rem] border border-dashed border-border/60 bg-white/30 p-4 dark:bg-white/[0.04]"
          >
            <p className="flex items-center gap-2 font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">
              <MapPin className="h-3.5 w-3.5 opacity-70" />
              Record metadata
            </p>
            <p className="mt-2 font-body text-xs leading-relaxed text-muted-foreground">
              Last structural update {format(new Date(c.lastUpdate), "MMMM d, yyyy")}. Keywords: {c.keywords.join(", ")}.
            </p>
          </motion.section>
        </div>
      </ScrollArea>
    </div>
  );
}
