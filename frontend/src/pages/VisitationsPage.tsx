import { AdminLayout } from "@/components/AdminLayout";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { SlideOverPanel } from "@/components/donors/SlideOverPanel";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { socialWorkers } from "@/lib/caseloadMockData";
import { delay } from "@/lib/mockData";
import {
  initialHomeVisits,
  pastConferences,
  upcomingConferences,
  type ConferencePast,
  type ConferenceUpcoming,
  type HomeVisitEntry,
  type VisitType,
} from "@/lib/visitationsConferencesMockData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Home,
  MapPin,
  Plus,
  Shield,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const visitTypeStyles: Record<VisitType, string> = {
  "Initial assessment":
    "border-[hsl(210_28%_88%)] bg-[hsl(210_22%_96%)] text-[hsl(210_30%_30%)] dark:border-white/12 dark:bg-white/[0.08] dark:text-[hsl(210_25%_85%)]",
  "Routine follow-up":
    "border-[hsl(340_30%_88%)] bg-[hsl(340_28%_97%)] text-[hsl(340_32%_32%)] dark:border-white/12 dark:bg-[hsl(340_22%_16%)] dark:text-[hsl(340_35%_88%)]",
  Reintegration:
    "border-[hsl(150_28%_88%)] bg-[hsl(150_24%_96%)] text-[hsl(150_28%_28%)] dark:border-white/12 dark:bg-[hsl(150_18%_16%)] dark:text-[hsl(150_30%_82%)]",
  Emergency:
    "border-[hsl(0_35%_85%)] bg-[hsl(0_28%_97%)] text-[hsl(0_32%_32%)] dark:border-[hsl(0_28%_28%)] dark:bg-[hsl(0_22%_16%)] dark:text-[hsl(0_28%_78%)]",
};

function cooperationDots(level: HomeVisitEntry["cooperation"]) {
  const n = level === "Strong" ? 3 : level === "Moderate" ? 2 : 1;
  return (
    <span className="inline-flex gap-0.5" title={`Cooperation: ${level}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-4 rounded-full",
            i < n ? "bg-[hsl(150_32%_48%)]" : "bg-muted-foreground/20"
          )}
        />
      ))}
    </span>
  );
}

function VisitDetailSheet({ v }: { v: HomeVisitEntry }) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-white/45 px-6 pb-6 pt-8 dark:border-white/10">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide",
            visitTypeStyles[v.visitType]
          )}
        >
          {v.visitType}
        </span>
        <h2 className="mt-4 font-display text-2xl font-semibold tracking-[-0.03em]">Home visit record</h2>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          {v.resident} · {v.residentCaseId}
        </p>
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
        <p className="mt-2 font-body text-sm text-muted-foreground">{v.worker}</p>
      </div>
      <ScrollArea className="flex-1 px-6">
        <div className="space-y-8 py-8 pb-24">
          <section>
            <h3 className="mb-3 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
              Location
            </h3>
            <p className="flex items-start gap-2 font-body text-sm leading-relaxed text-foreground/90">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 opacity-50" />
              {v.address}
            </p>
          </section>
          <section>
            <h3 className="mb-3 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
              Environment observations
            </h3>
            <p className="rounded-[1rem] bg-white/50 px-4 py-3 font-body text-[15px] leading-relaxed text-foreground/92 dark:bg-white/[0.06]">
              {v.environmentObservations}
            </p>
          </section>
          <section>
            <h3 className="mb-3 flex items-center gap-2 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
              Family cooperation
              {cooperationDots(v.cooperation)}
            </h3>
            <p className="font-body text-sm text-foreground/88">Level recorded: {v.cooperation}</p>
          </section>
          <section>
            <h3 className="mb-3 flex items-center gap-2 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
              <Shield className="h-3.5 w-3.5" />
              Safety concerns
            </h3>
            {v.safetyConcerns ? (
              <p className="rounded-[1rem] border border-[hsl(0_30%_88%)]/80 bg-[hsl(0_25%_98%)] px-4 py-3 font-body text-sm leading-relaxed text-[hsl(0_30%_28%)] dark:border-[hsl(0_25%_25%)] dark:bg-[hsl(0_22%_14%)] dark:text-[hsl(0_25%_82%)]">
                {v.safetyConcerns}
              </p>
            ) : (
              <p className="font-body text-sm text-muted-foreground">None recorded at time of visit.</p>
            )}
          </section>
          <section>
            <h3 className="mb-3 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
              Follow-up actions
            </h3>
            <p className="font-body text-sm leading-relaxed text-foreground/90">{v.followUp}</p>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}

function ConferenceSheet({ kind, upcoming, past }: { kind: "upcoming"; upcoming: ConferenceUpcoming } | { kind: "past"; past: ConferencePast }) {
  if (kind === "upcoming") {
    const u = upcoming;
    return (
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b border-white/45 px-6 pb-6 pt-8 dark:border-white/10">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.03em]">{u.title}</h2>
          <p className="mt-2 font-body text-sm text-muted-foreground">
            {u.resident} · {u.residentCaseId}
          </p>
          <div className="mt-4 space-y-2 font-body text-sm">
            <p className="flex items-center gap-2">
              <Calendar className="h-4 w-4 opacity-60" />
              {format(new Date(u.date), "EEEE, MMMM d, yyyy")} · {u.time}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 opacity-60" />
              {u.location}
            </p>
          </div>
        </div>
        <ScrollArea className="flex-1 px-6">
          <div className="py-8 pb-24">
            <h3 className="mb-4 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
              Participants
            </h3>
            <ul className="space-y-2">
              {u.participants.map((p) => (
                <li
                  key={p}
                  className="flex items-center gap-2 rounded-xl border border-white/45 bg-white/45 px-3 py-2 font-body text-sm dark:border-white/10 dark:bg-white/[0.06]"
                >
                  <Users className="h-3.5 w-3.5 opacity-50" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      </div>
    );
  }
  const p = past;
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-white/45 px-6 pb-6 pt-8 dark:border-white/10">
        <p className="font-mono text-[11px] text-muted-foreground">{p.id}</p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em]">{p.title}</h2>
        <p className="mt-2 font-body text-sm text-muted-foreground">{format(new Date(p.date), "MMMM d, yyyy")}</p>
      </div>
      <ScrollArea className="flex-1 px-6">
        <div className="space-y-8 py-8 pb-24">
          <section>
            <h3 className="mb-3 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
              Summary
            </h3>
            <p className="font-body text-[15px] leading-relaxed text-foreground/90">{p.summary}</p>
          </section>
          <section>
            <h3 className="mb-3 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
              Outcomes
            </h3>
            <p className="rounded-[1rem] bg-white/50 px-4 py-3 font-body text-sm leading-relaxed dark:bg-white/[0.06]">
              {p.outcomes}
            </p>
          </section>
          <section>
            <h3 className="mb-3 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
              Participants
            </h3>
            <p className="font-body text-sm text-foreground/85">{p.participants.join(", ")}</p>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}

const VisitationsPage = () => {
  usePageHeader("Visitations & Conferences", "Field & coordination");

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("visits");
  const [visits, setVisits] = useState<HomeVisitEntry[]>(initialHomeVisits);
  const [visitOpen, setVisitOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<HomeVisitEntry | null>(null);
  const [confOpen, setConfOpen] = useState(false);
  const [confPayload, setConfPayload] = useState<
    { kind: "upcoming"; data: ConferenceUpcoming } | { kind: "past"; data: ConferencePast } | null
  >(null);
  const [logOpen, setLogOpen] = useState(false);
  const [form, setForm] = useState({
    visitType: "Routine follow-up" as VisitType,
    date: new Date().toISOString().slice(0, 10),
    time: "10:00 AM",
    resident: "Resident A.",
    residentCaseId: "CS-2026-0142",
    worker: socialWorkers[0],
    address: "",
    environmentObservations: "",
    cooperation: "Moderate" as HomeVisitEntry["cooperation"],
    safetyConcerns: "",
    followUp: "",
  });

  useEffect(() => {
    delay(620).then(() => setLoading(false));
  }, []);

  return (
    <AdminLayout contentClassName="max-w-[min(100%,90rem)]">
      <StaffPageShell
        eyebrow="Field operations"
        eyebrowIcon={<Home className="h-3.5 w-3.5 text-[hsl(340_38%_52%)]" strokeWidth={1.5} />}
        title="Home Visitation & Case Conferences"
        description="Track home visits and multi-disciplinary coordination in one place."
        actions={
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="button"
              onClick={() => setLogOpen(true)}
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
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-10 grid h-12 w-full max-w-md grid-cols-2 rounded-2xl border border-white/50 bg-white/45 p-1 shadow-inner backdrop-blur-md dark:border-white/10 dark:bg-white/[0.08]">
            <TabsTrigger
              value="visits"
              className="rounded-xl font-body text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-white/15"
            >
              Home Visits
            </TabsTrigger>
            <TabsTrigger
              value="conferences"
              className="rounded-xl font-body text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-white/15"
            >
              Case Conferences
            </TabsTrigger>
          </TabsList>

            <TabsContent value="visits" className="mt-0 outline-none">
              <motion.div
                key="visits"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="space-y-5"
              >
                <div className="mb-2">
                  <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                    Visit log
                  </p>
                  <h2 className="mt-2 font-display text-xl font-semibold text-foreground">Scheduled & completed</h2>
                </div>
                {loading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-48 rounded-[1.15rem] bg-white/40 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {visits.map((v, i) => (
                      <motion.button
                        key={v.id}
                        type="button"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 * i, duration: 0.4 }}
                        whileHover={{ y: -4, transition: { duration: 0.22 } }}
                        onClick={() => {
                          setSelectedVisit(v);
                          setVisitOpen(true);
                        }}
                        className={cn(
                          "relative w-full overflow-hidden rounded-[1.15rem] border border-white/50 bg-white/55 p-5 text-left shadow-[0_4px_28px_rgba(45,35,48,0.05)] backdrop-blur-md transition-shadow hover:shadow-[0_16px_48px_rgba(45,35,48,0.1)] dark:border-white/10 dark:bg-white/[0.07]",
                          v.visitType === "Emergency" &&
                            "ring-1 ring-[hsl(0_35%_82%)]/70 dark:ring-[hsl(0_28%_28%)]/50"
                        )}
                      >
                        {v.visitType === "Emergency" && (
                          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[hsl(0_40%_72%)]/50 to-transparent" />
                        )}
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide",
                              visitTypeStyles[v.visitType]
                            )}
                          >
                            {v.visitType}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">{v.id}</span>
                        </div>
                        <p className="mt-4 font-display text-lg font-semibold text-foreground">{v.resident}</p>
                        <p className="mt-1 font-body text-xs text-muted-foreground">{v.residentCaseId}</p>
                        <div className="mt-4 flex flex-wrap gap-3 font-body text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {v.date}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {v.time}
                          </span>
                        </div>
                        <p className="mt-3 line-clamp-2 font-body text-sm text-foreground/85">{v.environmentObservations}</p>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/40 pt-3 dark:border-white/10">
                          <span className="font-body text-[11px] text-muted-foreground">{v.worker}</span>
                          {cooperationDots(v.cooperation)}
                          {v.safetyConcerns && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[hsl(0_25%_96%)] px-2 py-0.5 font-body text-[10px] font-semibold text-[hsl(0_30%_36%)] dark:bg-[hsl(0_22%_18%)] dark:text-[hsl(0_25%_78%)]">
                              <AlertTriangle className="h-3 w-3" />
                              Safety
                            </span>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="conferences" className="mt-0 outline-none">
              <motion.div
                key="conf"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="space-y-12"
              >
                <section className="rounded-[1.15rem] border border-white/45 bg-white/40 p-5 shadow-inner backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.05]">
                  <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
                    Calendar preview
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {upcomingConferences.map((u) => (
                      <div
                        key={u.id}
                        className="min-w-[7rem] rounded-xl border border-white/50 bg-gradient-to-b from-white/80 to-[hsl(36_32%_98%)] px-4 py-3 text-center shadow-sm dark:border-white/10 dark:from-white/10 dark:to-transparent"
                      >
                        <p className="font-body text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {format(new Date(u.date), "MMM")}
                        </p>
                        <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">
                          {format(new Date(u.date), "d")}
                        </p>
                        <p className="mt-1 font-body text-[10px] text-muted-foreground">{u.time}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="mb-6 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground/70" strokeWidth={1.5} />
                    <h2 className="font-display text-xl font-semibold tracking-tight">Upcoming Conferences</h2>
                  </div>
                  <div className="grid gap-5 lg:grid-cols-2">
                    {upcomingConferences.map((u, i) => (
                      <motion.button
                        key={u.id}
                        type="button"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i }}
                        whileHover={{ y: -3 }}
                        onClick={() => {
                          setConfPayload({ kind: "upcoming", data: u });
                          setConfOpen(true);
                        }}
                        className="rounded-[1.15rem] border border-white/50 bg-gradient-to-br from-white/70 to-[hsl(36_30%_98%)]/80 p-6 text-left shadow-[0_8px_36px_rgba(45,35,48,0.06)] backdrop-blur-md transition-shadow hover:shadow-[0_16px_52px_rgba(45,35,48,0.1)] dark:border-white/10 dark:from-white/[0.09] dark:to-white/[0.05]"
                      >
                        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(340_32%_42%)] dark:text-[hsl(340_35%_78%)]">
                          {format(new Date(u.date), "EEE · MMM d")} · {u.time}
                        </p>
                        <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{u.title}</h3>
                        <p className="mt-2 font-body text-sm text-muted-foreground">
                          {u.resident} · {u.residentCaseId}
                        </p>
                        <p className="mt-4 line-clamp-2 font-body text-xs text-muted-foreground">{u.location}</p>
                      </motion.button>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="mb-6 flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground/70" strokeWidth={1.5} />
                    <h2 className="font-display text-xl font-semibold tracking-tight">Past conferences</h2>
                  </div>
                  <div className="relative space-y-4 pl-4 sm:pl-6">
                    <div
                      className="absolute bottom-2 left-[7px] top-2 w-px sm:left-[11px]"
                      style={{
                        background:
                          "linear-gradient(180deg, hsl(340 40% 82% / 0.85) 0%, hsl(210 25% 85% / 0.4) 100%)",
                      }}
                    />
                    {pastConferences.map((p, i) => (
                      <motion.button
                        key={p.id}
                        type="button"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.06 * i }}
                        whileHover={{ x: 4 }}
                        onClick={() => {
                          setConfPayload({ kind: "past", data: p });
                          setConfOpen(true);
                        }}
                        className="relative ml-4 block w-[calc(100%-1rem)] rounded-[1.1rem] border border-white/45 bg-white/50 p-5 text-left shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-white/[0.06] sm:ml-6"
                      >
                        <span className="absolute -left-[21px] top-6 h-2.5 w-2.5 rounded-full border-2 border-white bg-[hsl(340_40%_78%)] shadow sm:-left-[25px]" />
                        <p className="font-body text-[11px] font-medium text-muted-foreground">
                          {format(new Date(p.date), "MMMM yyyy")}
                        </p>
                        <h3 className="mt-2 font-display text-base font-semibold text-foreground">{p.title}</h3>
                        <p className="mt-2 line-clamp-2 font-body text-sm text-muted-foreground">{p.summary}</p>
                      </motion.button>
                    ))}
                  </div>
                </section>
              </motion.div>
            </TabsContent>
        </Tabs>
      </StaffPageShell>

      <SlideOverPanel
        open={visitOpen}
        onOpenChange={setVisitOpen}
        className="sm:max-w-[min(100%,28rem)] lg:max-w-[min(100%,34rem)]"
      >
        {selectedVisit && <VisitDetailSheet v={selectedVisit} />}
      </SlideOverPanel>

      <SlideOverPanel open={confOpen} onOpenChange={setConfOpen} className="sm:max-w-[min(100%,28rem)] lg:max-w-[min(100%,34rem)]">
        {confPayload?.kind === "upcoming" && <ConferenceSheet kind="upcoming" upcoming={confPayload.data} />}
        {confPayload?.kind === "past" && <ConferenceSheet kind="past" past={confPayload.data} />}
      </SlideOverPanel>

      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="max-w-md rounded-[1.2rem] border-0 bg-[hsl(36_32%_97%)] dark:bg-[hsl(213_40%_10%)]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-semibold">Log home visit</DialogTitle>
            <DialogDescription className="font-body text-sm">
              Capture essential field notes. Full QA in production systems.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Visit type</Label>
              <Select value={form.visitType} onValueChange={(v) => setForm((f) => ({ ...f, visitType: v as VisitType }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["Initial assessment", "Routine follow-up", "Reintegration", "Emergency"] as const).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Time</Label>
                <Input value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Address / location</Label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="rounded-xl" placeholder="Redacted or general area" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Observations</Label>
              <Textarea
                value={form.environmentObservations}
                onChange={(e) => setForm((f) => ({ ...f, environmentObservations: e.target.value }))}
                className="min-h-[88px] rounded-xl font-body text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setLogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-gradient-to-r from-[hsl(340_44%_62%)] to-[hsl(10_42%_56%)] font-semibold text-white"
              onClick={() => {
                const id = `HV-${Date.now().toString().slice(-5)}`;
                const entry: HomeVisitEntry = {
                  id,
                  visitType: form.visitType,
                  date: form.date,
                  time: form.time,
                  resident: form.resident,
                  residentCaseId: form.residentCaseId,
                  worker: form.worker,
                  address: form.address || "███ (provided separately)",
                  environmentObservations: form.environmentObservations || "—",
                  cooperation: form.cooperation,
                  safetyConcerns: form.safetyConcerns || null,
                  followUp: form.followUp || "—",
                  status: "Scheduled",
                };
                setVisits((prev) => [entry, ...prev]);
                setLogOpen(false);
                toast.success("Visit logged", { description: "Added to the visit log (demo)." });
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default VisitationsPage;
