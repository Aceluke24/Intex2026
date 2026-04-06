import { AdminLayout } from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { delay, donors } from "@/lib/mockData";
import { SkeletonTable } from "@/components/SkeletonLoaders";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const DonorsPage = () => {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("All");

  useEffect(() => { delay(900).then(() => setLoading(false)); }, []);

  const filtered = donors.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.email.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === "All" || d.churnRisk === riskFilter;
    return matchSearch && matchRisk;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Donors & Contributions</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Manage donor relationships and track contributions.</p>
        </div>

        {loading ? <SkeletonTable rows={6} /> : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b border-border">
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search donors..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 font-body" />
              </div>
              <div className="flex items-center gap-2">
                {["All", "Low", "Medium", "High"].map((r) => (
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
                  <TableHead className="font-body text-xs">Donor</TableHead>
                  <TableHead className="font-body text-xs">Total Given</TableHead>
                  <TableHead className="font-body text-xs hidden md:table-cell">Frequency</TableHead>
                  <TableHead className="font-body text-xs hidden md:table-cell">Last Donation</TableHead>
                  <TableHead className="font-body text-xs">Churn Risk</TableHead>
                  <TableHead className="font-body text-xs hidden lg:table-cell">AI Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id} className="cursor-pointer hover:bg-secondary/50">
                    <TableCell>
                      <div>
                        <p className="font-body font-medium text-sm text-card-foreground">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-body text-sm font-medium">${d.totalGiven.toLocaleString()}</TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground hidden md:table-cell">{d.frequency}</TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground hidden md:table-cell">{d.lastDonation}</TableCell>
                    <TableCell>
                      <span className={cn("px-2 py-1 rounded-full text-xs font-body font-medium", {
                        "bg-sage/15 text-sage": d.churnRisk === "Low",
                        "bg-gold/15 text-gold": d.churnRisk === "Medium",
                        "bg-terracotta/15 text-terracotta": d.churnRisk === "High",
                      })}>{d.churnRisk}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", {
                            "bg-sage": d.score >= 70,
                            "bg-gold": d.score >= 40 && d.score < 70,
                            "bg-terracotta": d.score < 40,
                          })} style={{ width: `${d.score}%` }} />
                        </div>
                        <span className="text-xs font-body text-muted-foreground">{d.score}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filtered.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-muted-foreground font-body text-sm">No donors match your criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default DonorsPage;
