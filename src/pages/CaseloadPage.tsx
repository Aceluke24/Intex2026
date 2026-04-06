import { AdminLayout } from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { delay, residents } from "@/lib/mockData";
import { SkeletonTable } from "@/components/SkeletonLoaders";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const CaseloadPage = () => {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");

  useEffect(() => { delay(700).then(() => setLoading(false)); }, []);

  const filtered = residents.filter((r) => {
    const match = r.name.toLowerCase().includes(search.toLowerCase()) || r.program.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === "All" || r.riskLevel === riskFilter;
    return match && matchRisk;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Caseload</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">Track resident progress and flag those needing attention.</p>
        </div>

        {loading ? <SkeletonTable rows={6} /> : (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search residents..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 rounded-xl border-0 bg-secondary font-body text-sm" />
              </div>
              <div className="flex items-center gap-1.5 bg-secondary rounded-xl p-1">
                {["All", "Low", "Moderate", "High"].map((r) => (
                  <button key={r} onClick={() => setRiskFilter(r)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all",
                      riskFilter === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}>
                    {r}
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs font-body text-muted-foreground ml-auto">
                <Download className="w-3.5 h-3.5" /> Export
              </Button>
            </div>

            <div className="bg-card rounded-2xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/50 hover:bg-transparent">
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Resident</TableHead>
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Program</TableHead>
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium hidden md:table-cell">Days</TableHead>
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Risk</TableHead>
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Progress</TableHead>
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium hidden lg:table-cell">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} className={cn(
                      "border-b border-border/30 cursor-pointer hover:bg-secondary/30 transition-colors",
                      r.riskLevel === "High" && "bg-terracotta/4"
                    )}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full flex-shrink-0", {
                            "bg-sage": r.riskLevel === "Low",
                            "bg-gold": r.riskLevel === "Moderate",
                            "bg-terracotta": r.riskLevel === "High",
                          })} />
                          <div>
                            <p className="font-body font-medium text-sm text-foreground">{r.name}</p>
                            <p className="text-xs text-muted-foreground">Age {r.age}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">{r.program}</TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground hidden md:table-cell">{r.daysInProgram}d</TableCell>
                      <TableCell>
                        <span className={cn("text-xs font-body font-medium", {
                          "text-sage": r.riskLevel === "Low",
                          "text-gold": r.riskLevel === "Moderate",
                          "text-terracotta": r.riskLevel === "High",
                        })}>{r.riskLevel}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <div className="w-16 h-1 bg-secondary rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", {
                              "bg-sage": r.progressScore >= 70,
                              "bg-gold": r.progressScore >= 40 && r.progressScore < 70,
                              "bg-terracotta": r.progressScore < 40,
                            })} style={{ width: `${r.progressScore}%` }} />
                          </div>
                          <span className="text-xs font-body text-muted-foreground">{r.progressScore}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className={cn("text-xs font-body font-medium", {
                          "text-sage": r.status === "Active",
                          "text-gold": r.status === "Transitioning",
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

export default CaseloadPage;
