import { AdminLayout } from "@/components/AdminLayout";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const PROGRAM_AREAS = ["Education", "Wellbeing", "Operations", "Transport", "Maintenance", "Outreach", "General"];
const CATEGORIES = ["Rent", "Food", "Salaries", "Medical", "Utilities", "Supplies", "Transport", "Other"];

type Safehouse = { safehouseId: number; name: string };
type Expense = {
  expenseId: number;
  safehouseId: number | null;
  safehouseName: string | null;
  programArea: string;
  category: string;
  amount: number;
  expenseDate: string;
  description: string | null;
  recordedBy: string | null;
};

type ExpenseForm = {
  safehouseId: string;
  programArea: string;
  category: string;
  amount: string;
  expenseDate: string;
  description: string;
  recordedBy: string;
};

const emptyForm = (): ExpenseForm => ({
  safehouseId: "",
  programArea: "Operations",
  category: "Other",
  amount: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  description: "",
  recordedBy: "",
});

const PHP = (n: number) =>
  `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ExpensesPage() {
  usePageHeader("Expenses", "Record & review organizational spending");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [safehouses, setSafehouses] = useState<Safehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set("category", filterCategory);
      if (filterArea) params.set("programArea", filterArea);
      if (filterFrom) params.set("from", filterFrom);
      if (filterTo) params.set("to", filterTo);
      const [exp, sh] = await Promise.all([
        apiFetchJson<Expense[]>(`${API_PREFIX}/expenses?${params}`),
        apiFetchJson<Safehouse[]>(`${API_PREFIX}/safehouses`),
      ]);
      setExpenses(exp);
      setSafehouses(sh);
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterArea, filterFrom, filterTo]);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditingId(e.expenseId);
    setForm({
      safehouseId: e.safehouseId?.toString() ?? "",
      programArea: e.programArea,
      category: e.category,
      amount: e.amount.toString(),
      expenseDate: e.expenseDate,
      description: e.description ?? "",
      recordedBy: e.recordedBy ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        safehouseId: form.safehouseId ? parseInt(form.safehouseId) : null,
        programArea: form.programArea,
        category: form.category,
        amount: parseFloat(form.amount) || 0,
        expenseDate: form.expenseDate,
        description: form.description || null,
        recordedBy: form.recordedBy || null,
      };
      const url = editingId ? `${API_PREFIX}/expenses/${editingId}` : `${API_PREFIX}/expenses`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(editingId ? "Expense updated" : "Expense added");
      setDialogOpen(false);
      void load();
    } catch {
      toast.error("Could not save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API_PREFIX}/expenses/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      toast.success("Expense deleted");
      void load();
    } catch {
      toast.error("Could not delete expense");
    } finally {
      setDeletingId(null);
    }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <AdminLayout contentClassName="max-w-6xl">
      <div className="space-y-6">
        {/* Filters + Add */}
        <div className="flex flex-wrap items-end gap-3">
          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm min-w-[140px]"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm min-w-[140px]"
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
          >
            <option value="">All Program Areas</option>
            {PROGRAM_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <input
            type="date"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            placeholder="From"
          />
          <input
            type="date"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            placeholder="To"
          />
          <div className="ml-auto">
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Expense
            </Button>
          </div>
        </div>

        {/* Summary */}
        {!loading && expenses.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{expenses.length} record{expenses.length !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span className="font-semibold text-foreground">{PHP(total)} total</span>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-border overflow-hidden"
          >
            {expenses.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                No expenses found. Adjust filters or add one above.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {["Date", "Category", "Program Area", "Safehouse", "Amount", "Description", "Recorded By", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expenses.map((e) => (
                    <tr key={e.expenseId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{e.expenseDate}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{e.category}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.programArea}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.safehouseName ?? "Org-wide"}</td>
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{PHP(e.amount)}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{e.description ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.recordedBy ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(e)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                            disabled={deletingId === e.expenseId}
                            onClick={() => void handleDelete(e.expenseId)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 border-t border-border">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</td>
                    <td className="px-4 py-3 font-bold text-foreground">{PHP(total)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            )}
          </motion.div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Expense" : "Add Expense"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
                <select
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Program Area</label>
                <select
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={form.programArea}
                  onChange={(e) => setForm((f) => ({ ...f, programArea: e.target.value }))}
                >
                  {PROGRAM_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Amount (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Date</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={form.expenseDate}
                  onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Safehouse (optional)</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.safehouseId}
                onChange={(e) => setForm((f) => ({ ...f, safehouseId: e.target.value }))}
              >
                <option value="">Org-wide</option>
                {safehouses.map((s) => <option key={s.safehouseId} value={s.safehouseId}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Description (optional)</label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. April rent for Safehouse 2"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Recorded By (optional)</label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.recordedBy}
                onChange={(e) => setForm((f) => ({ ...f, recordedBy: e.target.value }))}
                placeholder="Staff name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleSave()} disabled={saving || !form.amount || !form.expenseDate}>
              {saving ? "Saving…" : editingId ? "Update" : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
