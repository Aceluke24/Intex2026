import { AdminLayout } from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { delay, donors } from "@/lib/mockData";
import { SkeletonTable } from "@/components/SkeletonLoaders";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DonorsPage = () => {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");

  useEffect(() => { delay(700).then(() => setLoading(false)); }, []);

  const filtered = donors.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.email.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === "All" || d.churnRisk === riskFilter;
    return matchSearch && matchRisk;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Donors</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">Manage relationships and track giving patterns.</p>
        </div>

        {loading ? <SkeletonTable rows={6} /> : (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search donors..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 rounded-xl border-0 bg-secondary font-body text-sm" />
              </div>
              <div className="flex items-center gap-1.5 bg-secondary rounded-xl p-1">
                {["All", "Low", "Medium", "High"].map((r) => (
                  <button key={r} onClick={() => setRiskFilter(r)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all",
                      riskFilter === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}>
                    {r}
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground ml-auto">
                <Download className="w-3.5 h-3.5" /> Export
              </Button>
            </div>

            <div className="bg-card rounded-2xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/50 hover:bg-transparent">
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Donor</TableHead>
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Total Given</TableHead>
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium hidden md:table-cell">Frequency</TableHead>
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium hidden md:table-cell">Last Gift</TableHead>
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Risk</TableHead>
                    <TableHead className="font-body text-[11px] uppercase tracking-wider text-muted-foreground font-medium hidden lg:table-cell">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.id} className="border-b border-border/30 cursor-pointer hover:bg-secondary/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-terracotta/10 flex items-center justify-center flex-shrink-0">
                            <span className="font-display text-xs font-bold text-terracotta">{d.name[0]}</span>
                          </div>
                          <div>
                            <p className="font-body font-medium text-sm text-foreground">{d.name}</p>
                            <p className="text-xs text-muted-foreground">{d.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-body text-sm font-medium">${d.totalGiven.toLocaleString()}</TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground hidden md:table-cell">{d.frequency}</TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground hidden md:table-cell">{d.lastDonation}</TableCell>
                      <TableCell>
                        <span className={cn("text-xs font-body font-medium", {
                          "text-sage": d.churnRisk === "Low",
                          "text-gold": d.churnRisk === "Medium",
                          "text-terracotta": d.churnRisk === "High",
                        })}>{d.churnRisk}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1 bg-secondary rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", {
                              "bg-sage": d.score >= 70,
                              "bg-gold": d.score >= 40 && d.score < 70,
                              "bg-terracotta": d.score < 40,
                            })} style={{ width: `${d.score}%` }} />
                          </div>
                          <span className="text-xs font-body text-muted-foreground w-6">{d.score}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length === 0 && (
                <div className="p-16 text-center">
                  <p className="text-muted-foreground font-body text-sm">No donors match your criteria.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default DonorsPage;
