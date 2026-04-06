import { AdminLayout } from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { delay, homeVisitations } from "@/lib/mockData";
import { SkeletonTable } from "@/components/SkeletonLoaders";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const VisitationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  useEffect(() => { delay(600).then(() => setLoading(false)); }, []);

  const filtered = homeVisitations.filter((v) =>
    v.resident.toLowerCase().includes(search.toLowerCase()) || v.worker.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Visitations</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">Schedule and track home visits.</p>
          </div>
          <Button className="rounded-xl bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 font-body gap-1.5 h-9 text-sm">
            <Plus className="w-3.5 h-3.5" /> Schedule
          </Button>
        </div>

        {loading ? <SkeletonTable rows={4} /> : (
          <>
            <div className="relative max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 rounded-xl border-0 bg-secondary font-body text-sm" />
            </div>

            <div className="bg-card rounded-2xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/50 hover:bg-transparent">
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Resident</TableHead>
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Schedule</TableHead>
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium hidden md:table-cell">Worker</TableHead>
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium hidden lg:table-cell">Notes</TableHead>
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v) => (
                    <TableRow key={v.id} className="border-b border-border/30 cursor-pointer hover:bg-secondary/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-body font-medium text-sm text-foreground">{v.resident}</p>
                            <p className="text-xs text-muted-foreground">{v.address}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm font-body text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {v.date} · {v.time}
                        </div>
                      </TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground hidden md:table-cell">{v.worker}</TableCell>
                      <TableCell className="font-body text-xs text-muted-foreground hidden lg:table-cell max-w-[180px] truncate">{v.notes}</TableCell>
                      <TableCell>
                        <span className={cn("text-xs font-body font-medium", {
                          "text-gold": v.status === "Scheduled",
                          "text-sage": v.status === "Completed",
                          "text-terracotta": v.status === "Cancelled",
                        })}>{v.status}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default VisitationsPage;
