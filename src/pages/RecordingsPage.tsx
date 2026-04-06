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

  useEffect(() => { delay(800).then(() => setLoading(false)); }, []);

  const filtered = processRecordings.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) || r.worker.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Process Recordings</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">Session notes, assessments, and case documentation.</p>
          </div>
          <Button className="bg-gold text-navy hover:bg-gold/90 font-body gap-1 h-9 text-sm">
            <Plus className="w-3.5 h-3.5" /> New Recording
          </Button>
        </div>

        {loading ? <SkeletonTable rows={5} /> : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search recordings..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 font-body" />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body text-xs">Document</TableHead>
                  <TableHead className="font-body text-xs hidden md:table-cell">Type</TableHead>
                  <TableHead className="font-body text-xs hidden md:table-cell">Worker</TableHead>
                  <TableHead className="font-body text-xs">Date</TableHead>
                  <TableHead className="font-body text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-secondary/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-body font-medium text-sm text-card-foreground">{r.title}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{r.worker} · {r.type}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground hidden md:table-cell">{r.type}</TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground hidden md:table-cell">{r.worker}</TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">{r.date}</TableCell>
                    <TableCell>
                      <span className={cn("px-2 py-1 rounded-full text-xs font-body font-medium", {
                        "bg-sage/15 text-sage": r.status === "Complete",
                        "bg-gold/15 text-gold": r.status === "Pending" || r.status === "Draft",
                        "bg-terracotta/15 text-terracotta": r.status === "Urgent Review",
                      })}>{r.status}</span>
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

export default RecordingsPage;
