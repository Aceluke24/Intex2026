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

  useEffect(() => { delay(800).then(() => setLoading(false)); }, []);

  const filtered = homeVisitations.filter((v) =>
    v.resident.toLowerCase().includes(search.toLowerCase()) || v.worker.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Home Visitations</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">Schedule and track home visits for transitioning residents.</p>
          </div>
          <Button className="bg-gold text-navy hover:bg-gold/90 font-body gap-1 h-9 text-sm">
            <Plus className="w-3.5 h-3.5" /> Schedule Visit
          </Button>
        </div>

        {loading ? <SkeletonTable rows={4} /> : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search visits..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 font-body" />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body text-xs">Resident</TableHead>
                  <TableHead className="font-body text-xs">Date & Time</TableHead>
                  <TableHead className="font-body text-xs hidden md:table-cell">Worker</TableHead>
                  <TableHead className="font-body text-xs hidden lg:table-cell">Notes</TableHead>
                  <TableHead className="font-body text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id} className="cursor-pointer hover:bg-secondary/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-body font-medium text-sm text-card-foreground">{v.resident}</p>
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
                    <TableCell className="font-body text-xs text-muted-foreground hidden lg:table-cell max-w-[200px] truncate">{v.notes}</TableCell>
                    <TableCell>
                      <span className={cn("px-2 py-1 rounded-full text-xs font-body font-medium", {
                        "bg-gold/15 text-gold": v.status === "Scheduled",
                        "bg-sage/15 text-sage": v.status === "Completed",
                        "bg-terracotta/15 text-terracotta": v.status === "Cancelled",
                      })}>{v.status}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default VisitationsPage;
