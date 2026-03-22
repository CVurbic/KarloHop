import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Fuel, Megaphone, Wrench, Warehouse } from "lucide-react";
import { format } from "date-fns";
import { hr } from "date-fns/locale";
import { useAllExpenses, useCreateExpense, useDeleteExpense } from "@/hooks/useExpenses";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "fuel", label: "Gorivo", icon: Fuel, color: "bg-orange-100 text-orange-800" },
  { value: "marketing", label: "Marketing", icon: Megaphone, color: "bg-blue-100 text-blue-800" },
  { value: "depreciation", label: "Amortizacija", icon: Wrench, color: "bg-purple-100 text-purple-800" },
  { value: "garage", label: "Garaža", icon: Warehouse, color: "bg-green-100 text-green-800" },
  { value: "other", label: "Ostalo", icon: Wrench, color: "bg-gray-100 text-gray-800" },
];

const EMPTY_FORM = {
  category: "",
  amount: "",
  description: "",
  expense_date: new Date().toISOString().split("T")[0],
};

const ExpenseManager = () => {
  const { data: expenses = [], isLoading } = useAllExpenses();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Category stats
  const categoryStats = useMemo(() => {
    const totals: Record<string, number> = {};
    let total = 0;
    expenses.forEach((e) => {
      const amt = Number(e.amount);
      totals[e.category] = (totals[e.category] || 0) + amt;
      total += amt;
    });

    return CATEGORIES.map((cat) => ({
      ...cat,
      total: totals[cat.value] || 0,
      percentage: total > 0 ? (((totals[cat.value] || 0) / total) * 100).toFixed(0) : "0",
    }));
  }, [expenses]);

  const totalExpenses = categoryStats.reduce((s, c) => s + c.total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.amount) return;

    try {
      await createExpense.mutateAsync({
        category: formData.category,
        amount: Number(formData.amount),
        description: formData.description || null,
        expense_date: formData.expense_date,
      });
      toast.success("Trošak dodan");
      setFormData(EMPTY_FORM);
      setShowForm(false);
    } catch {
      toast.error("Greška pri dodavanju troška");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Obrisati ovaj trošak?")) return;
    try {
      await deleteExpense.mutateAsync(id);
      toast.success("Trošak obrisan");
    } catch {
      toast.error("Greška pri brisanju");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Troškovi</h1>
          <p className="text-gray-500 text-sm mt-1">Praćenje troškova po kategorijama</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novi trošak
        </Button>
      </div>

      {/* Category Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {categoryStats.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card key={cat.value}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${cat.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{cat.label}</span>
                </div>
                <p className="text-xl font-bold">{cat.total.toFixed(2)} €</p>
                <p className="text-xs text-gray-500">{cat.percentage}% ukupnog</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Total */}
      <Card>
        <CardContent className="pt-6 flex items-center justify-between">
          <span className="text-lg font-medium">Ukupni troškovi</span>
          <span className="text-2xl font-bold text-red-600">{totalExpenses.toFixed(2)} €</span>
        </CardContent>
      </Card>

      {/* Expense List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Svi troškovi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            </div>
          ) : expenses.length === 0 ? (
            <p className="text-sm text-gray-500">Nema unesenih troškova.</p>
          ) : (
            <div className="space-y-2">
              {expenses.map((expense) => {
                const cat = CATEGORIES.find((c) => c.value === expense.category);
                const Icon = cat?.icon || Wrench;
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${cat?.color || "bg-gray-100"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{cat?.label || expense.category}</span>
                          {expense.description && (
                            <span className="text-xs text-gray-500">— {expense.description}</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {format(new Date(expense.expense_date), "d. MMMM yyyy.", { locale: hr })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{Number(expense.amount).toFixed(2)} €</span>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(expense.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add expense dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novi trošak</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Kategorija</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Odaberi kategoriju" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Iznos (€)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div>
              <Label>Opis (opcionalno)</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Datum</Label>
              <Input
                type="date"
                required
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Odustani
              </Button>
              <Button type="submit" disabled={createExpense.isPending}>
                Dodaj trošak
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseManager;
