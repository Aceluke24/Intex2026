import { AdminLayout } from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { delay, processRecordings } from "@/lib/mockData";
import { SkeletonTable } from "@/components/SkeletonLoaders";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const RecordingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  useEffect(() => { delay(600).then(() => setLoading(false)); }, []);

  const filtered = processRecordings.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) || r.worker.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Recordings</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">Session notes, assessments, and case documentation.</p>
          </div>
          <Button className="rounded-xl bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 font-body gap-1.5 h-9 text-sm">
            <Plus className="w-3.5 h-3.5" /> New
          </Button>
        </div>

        {loading ? <SkeletonTable rows={5} /> : (
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
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Document</TableHead>
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium hidden md:table-cell">Type</TableHead>
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium hidden md:table-cell">Worker</TableHead>
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Date</TableHead>
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} className="border-b border-border/30 cursor-pointer hover:bg-secondary/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-body font-medium text-sm text-foreground">{r.title}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{r.worker}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground hidden md:table-cell">{r.type}</TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground hidden md:table-cell">{r.worker}</TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">{r.date}</TableCell>
                      <TableCell>
                        <span className={cn("text-xs font-body font-medium", {
                          "text-sage": r.status === "Complete",
                          "text-gold": r.status === "Pending" || r.status === "Draft",
                          "text-terracotta": r.status === "Urgent Review",
                        })}>{r.status}</span>
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

export default RecordingsPage;
