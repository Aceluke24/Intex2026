import { AdminLayout } from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { delay, residents } from "@/lib/mockData";
import { SkeletonTable } from "@/components/SkeletonLoaders";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const CaseloadPage = () => {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");

  useEffect(() => { delay(900).then(() => setLoading(false)); }, []);

  const filtered = residents.filter((r) => {
    const match = r.name.toLowerCase().includes(search.toLowerCase()) || r.program.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === "All" || r.riskLevel === riskFilter;
    return match && matchRisk;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Caseload Inventory</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Track resident progress and identify those needing attention.</p>
        </div>

        {loading ? <SkeletonTable rows={6} /> : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b border-border">
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search residents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 font-body" />
              </div>
              <div className="flex items-center gap-2">
                {["All", "Low", "Moderate", "High"].map((r) => (
                  <Button key={r} variant={riskFilter === r ? "default" : "outline"} size="sm"
                    onClick={() => setRiskFilter(r)}
                    className={cn("h-8 text-xs font-body", riskFilter === r && "bg-gold text-navy hover:bg-gold/90")}>
                    {r}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs font-body ml-auto">
                <Download className="w-3 h-3" /> Export
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body text-xs">ID</TableHead>
                  <TableHead className="font-body text-xs">Resident</TableHead>
                  <TableHead className="font-body text-xs">Program</TableHead>
                  <TableHead className="font-body text-xs hidden md:table-cell">Days</TableHead>
                  <TableHead className="font-body text-xs">Risk</TableHead>
                  <TableHead className="font-body text-xs">Progress</TableHead>
                  <TableHead className="font-body text-xs hidden lg:table-cell">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className={cn("cursor-pointer hover:bg-secondary/50", r.riskLevel === "High" && "bg-terracotta/5")}>
                    <TableCell className="font-body text-xs text-muted-foreground">{r.id}</TableCell>
                    <TableCell>
                      <p className="font-body font-medium text-sm text-card-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground">Age {r.age}</p>
                    </TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">{r.program}</TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground hidden md:table-cell">{r.daysInProgram}</TableCell>
                    <TableCell>
                      <span className={cn("px-2 py-1 rounded-full text-xs font-body font-medium", {
                        "bg-sage/15 text-sage": r.riskLevel === "Low",
                        "bg-gold/15 text-gold": r.riskLevel === "Moderate",
                        "bg-terracotta/15 text-terracotta": r.riskLevel === "High",
                      })}>{r.riskLevel}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[80px]">
                        <Progress value={r.progressScore} className="h-1.5 flex-1" />
                        <span className="text-xs font-body text-muted-foreground w-7">{r.progressScore}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-body font-medium", {
                        "bg-sage/15 text-sage": r.status === "Active",
                        "bg-gold/15 text-gold": r.status === "Transitioning",
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

export default CaseloadPage;
