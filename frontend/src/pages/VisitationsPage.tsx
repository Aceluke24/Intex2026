import { AdminLayout } from "@/components/AdminLayout";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { SlideOverPanel } from "@/components/donors/SlideOverPanel";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetchJson } from "@/lib/apiFetch";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { AlertTriangle, Calendar, Clock, Home, MapPin, Plus, Shield, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type VisitationRow = {
  id: number;
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
};

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

const VisitationsPage = () => {
  usePageHeader("Visitations & Conferences", "Field & coordination");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rows, setRows] = useState<VisitationRow[]>([]);
  const [tab, setTab] = useState("visits");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<VisitationRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiFetchJson<VisitationRow[]>("/api/visitations");
      setRows(data);
    } catch (e) {
      console.error(e);
      setLoadError(e instanceof Error ? e.message : "Failed to load visitations.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const homeVisits = useMemo(() => rows.filter((r) => r.visitType === "HomeVisit"), [rows]);
  const conferences = useMemo(() => rows.filter((r) => r.visitType === "CaseConference"), [rows]);

  const openRow = (v: VisitationRow) => {
    setSelected(v);
    setSheetOpen(true);
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
              onClick={() =>
                toast.message("Log visit", {
                  description: "Create or update visitations through the Home Visitations API.",
                })
              }
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

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-10 grid h-12 w-full max-w-md grid-cols-2 rounded-2xl border border-white/50 bg-white/45 p-1 shadow-inner backdrop-blur-md dark:border-white/10 dark:bg-white/[0.08]">
            <TabsTrigger
              value="visits"
              className="rounded-xl font-body text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-white/15"
            >
              Home Visits ({homeVisits.length})
            </TabsTrigger>
            <TabsTrigger
              value="conferences"
              className="rounded-xl font-body text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-white/15"
            >
              Conferences ({conferences.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visits" className="mt-0 outline-none">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-48 animate-pulse rounded-[1.15rem] bg-white/40" />
                ))}
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {homeVisits.map((v, i) => (
                  <motion.button
                    key={v.id}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.4 }}
                    whileHover={{ y: -4, transition: { duration: 0.22 } }}
                    onClick={() => openRow(v)}
                    className={cn(
                      "relative w-full overflow-hidden rounded-[1.15rem] border border-white/50 bg-white/55 p-5 text-left shadow-[0_4px_28px_rgba(45,35,48,0.05)] backdrop-blur-md transition-shadow hover:shadow-[0_16px_48px_rgba(45,35,48,0.1)] dark:border-white/10 dark:bg-white/[0.07]"
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <span className="inline-flex rounded-full border px-2.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide border-[hsl(340_30%_88%)] bg-[hsl(340_28%_97%)] text-[hsl(340_32%_32%)] dark:border-white/12 dark:bg-[hsl(340_22%_16%)] dark:text-[hsl(340_35%_88%)]">
                        Home visit
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">{v.id}</span>
                    </div>
                    <p className="mt-4 font-display text-lg font-semibold text-foreground">{v.residentName}</p>
                    <p className="mt-1 font-body text-xs text-muted-foreground">{v.caseId}</p>
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
                    <p className="mt-3 line-clamp-2 font-body text-sm text-foreground/85">{v.notes}</p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/40 pt-3 dark:border-white/10">
                      <span className="font-body text-[11px] text-muted-foreground">{v.staffName}</span>
                      {v.safetyFlag && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[hsl(0_25%_96%)] px-2 py-0.5 font-body text-[10px] font-semibold text-[hsl(0_30%_36%)] dark:bg-[hsl(0_22%_18%)] dark:text-[hsl(0_25%_78%)]">
                          <AlertTriangle className="h-3 w-3" />
                          Safety
                        </span>
                      )}
                    </div>
                  </motion.button>
                ))}
                {homeVisits.length === 0 && (
                  <p className="col-span-full py-16 text-center font-body text-sm text-muted-foreground">
                    No home visits on record.
                  </p>
                )}
              </div>
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
              <div className="grid gap-5 md:grid-cols-2">
                {conferences.map((v, i) => (
                  <motion.button
                    key={v.id}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i }}
                    whileHover={{ y: -3 }}
                    onClick={() => openRow(v)}
                    className="rounded-[1.15rem] border border-white/50 bg-gradient-to-br from-white/70 to-[hsl(36_30%_98%)]/80 p-6 text-left shadow-[0_8px_36px_rgba(45,35,48,0.06)] backdrop-blur-md dark:border-white/10 dark:from-white/[0.09] dark:to-white/[0.05]"
                  >
                    <div className="flex items-center gap-2 text-[hsl(340_32%_42%)] dark:text-[hsl(340_35%_78%)]">
                      <Users className="h-4 w-4" />
                      <span className="font-body text-[11px] font-semibold uppercase tracking-[0.14em]">Conference</span>
                    </div>
                    <p className="mt-3 font-body text-xs text-muted-foreground">
                      {format(new Date(v.date), "EEE · MMM d")} · {v.time}
                    </p>
                    <h3 className="mt-2 font-display text-lg font-semibold text-foreground">{v.residentName}</h3>
                    <p className="mt-2 font-body text-sm text-muted-foreground">{v.caseId}</p>
                    <p className="mt-4 line-clamp-3 font-body text-sm text-foreground/85">{v.notes}</p>
                  </motion.button>
                ))}
                {conferences.length === 0 && (
                  <p className="col-span-full py-16 text-center font-body text-sm text-muted-foreground">
                    No case conferences on record.
                  </p>
                )}
              </div>
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
    </AdminLayout>
  );
};

export default VisitationsPage;
