"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, startOfYear, endOfYear } from "date-fns";
import { vi } from "date-fns/locale";
import { Plus, Target, Trash2, AlertTriangle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/currency-input";
import { IconRenderer } from "@/components/shared/icon-renderer";
import { EmptyState } from "@/components/shared/empty-state";
import { CardListSkeleton } from "@/components/shared/skeleton-list";
import { formatCurrency, getMonthRange } from "@/lib/constants";
import { useBudgets } from "@/hooks/use-budgets";
import { useCategories } from "@/hooks/use-categories";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Budget, BudgetPeriod } from "@/types";

const PERIOD_OPTIONS = [
  { value: "weekly" as const, label: "Hàng tuần" },
  { value: "monthly" as const, label: "Hàng tháng" },
  { value: "yearly" as const, label: "Hàng năm" },
];

function getPeriodDates(period: BudgetPeriod, monthStartDay: number = 1): { start: string; end: string } {
  const now = new Date();
  switch (period) {
    case "weekly":
      return {
        start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    case "monthly": {
      const range = getMonthRange(now, monthStartDay);
      return {
        start: format(range.start, "yyyy-MM-dd"),
        end: format(range.end, "yyyy-MM-dd"),
      };
    }
    case "yearly":
      return {
        start: format(startOfYear(now), "yyyy-MM-dd"),
        end: format(endOfYear(now), "yyyy-MM-dd"),
      };
  }
}

export default function BudgetsPage() {
  const { profile } = useAuth();
  const monthStartDay = profile?.month_start_day ?? 1;
  const { budgets, loading: budgetsLoading, addBudget, updateBudget, deleteBudget, refetch } = useBudgets();
  const { categories } = useCategories("expense");
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);
  const [spentMap, setSpentMap] = useState<Record<string, number>>({});
  const [formData, setFormData] = useState({
    category_id: "",
    amount: 0,
    period: "monthly" as BudgetPeriod,
  });

  useEffect(() => {
    async function fetchSpent() {
      const supabase = createClient();
      const map: Record<string, number> = {};

      for (const budget of budgets) {
        const { start, end } = getPeriodDates(budget.period, monthStartDay);
        const { data } = await supabase
          .from("transactions")
          .select("amount")
          .eq("category_id", budget.category_id)
          .eq("type", "expense")
          .gte("transaction_date", start)
          .lte("transaction_date", end);

        map[budget.id] = (data ?? []).reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);
      }
      setSpentMap(map);
    }

    if (budgets.length > 0) fetchSpent();
  }, [budgets, monthStartDay]);

  async function handleAdd() {
    if (!formData.category_id || !formData.amount) return;
    try {
      const dates = getPeriodDates(formData.period, monthStartDay);
      const { error } = await addBudget({
        ...formData,
        start_date: dates.start,
        end_date: dates.end,
      });
      if (error) { toast.error("Thêm ngân sách thất bại", { description: error.message }); return; }
      toast.success("Đã thêm ngân sách");
      setShowForm(false);
      setFormData({ category_id: "", amount: 0, period: "monthly" });
    } catch (err) {
      toast.error("Lỗi không xác định", { description: String(err) });
    }
  }

  function openEdit(budget: Budget) {
    setEditingBudget(budget);
    setFormData({
      category_id: budget.category_id,
      amount: budget.amount,
      period: budget.period,
    });
    setShowForm(true);
  }

  async function handleEdit() {
    if (!editingBudget || !formData.amount) return;
    try {
      const dates = getPeriodDates(formData.period, monthStartDay);
      const { error } = await updateBudget(editingBudget.id, {
        amount: formData.amount,
        period: formData.period,
        start_date: dates.start,
        end_date: dates.end,
      });
      if (error) { toast.error("Cập nhật thất bại", { description: error.message }); return; }
      toast.success("Đã cập nhật ngân sách");
      setShowForm(false);
      setEditingBudget(null);
      setFormData({ category_id: "", amount: 0, period: "monthly" });
    } catch (err) {
      toast.error("Lỗi không xác định", { description: String(err) });
    }
  }

  async function handleDelete() {
    if (!deletingBudget) return;
    try {
      const { error } = await deleteBudget(deletingBudget.id);
      if (error) toast.error("Xóa thất bại", { description: error.message });
      else toast.success("Đã xóa ngân sách");
    } catch (err) {
      toast.error("Lỗi khi xóa", { description: String(err) });
    }
    setDeletingBudget(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ngân sách</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm ngân sách
        </Button>
      </div>

      {budgetsLoading ? (
        <CardListSkeleton rows={4} />
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Chưa có ngân sách"
          description="Thiết lập ngân sách để kiểm soát chi tiêu"
        >
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo ngân sách đầu tiên
          </Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {budgets.map((budget) => {
            const spent = spentMap[budget.id] ?? 0;
            const percent = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
            const isOver = spent > budget.amount;
            const isWarning = percent >= 80 && !isOver;
            const remaining = budget.amount - spent;

            return (
              <Card key={budget.id} className={cn(isOver && "border-destructive/50")}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${budget.category?.color}20` }}
                      >
                        <IconRenderer
                          name={budget.category?.icon ?? "Tag"}
                          className="h-5 w-5"
                          style={{ color: budget.category?.color }}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{budget.category?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {PERIOD_OPTIONS.find((p) => p.value === budget.period)?.label}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isOver && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Vượt mức
                        </Badge>
                      )}
                      {isWarning && (
                        <Badge variant="secondary" className="text-xs text-orange-500 border-orange-500/30">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Sắp hết
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(budget)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeletingBudget(budget)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-currency">
                        {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                      </span>
                      <span className="font-medium font-currency">{percent.toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={percent}
                      className={cn(
                        "h-2.5",
                        isOver && "[&>div]:bg-destructive",
                        isWarning && "[&>div]:bg-orange-500"
                      )}
                    />
                    <p className={cn(
                      "text-xs",
                      isOver ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {isOver
                        ? `Vượt ${formatCurrency(Math.abs(remaining))}`
                        : `Còn lại ${formatCurrency(remaining)}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Budget Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => {
        if (!open) { setShowForm(false); setEditingBudget(null); setFormData({ category_id: "", amount: 0, period: "monthly" }); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Sửa ngân sách" : "Thêm ngân sách"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingBudget && (
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select value={formData.category_id} onValueChange={(v) => v && setFormData({ ...formData, category_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục chi tiêu">
                      {formData.category_id ? categories.find((c) => c.id === formData.category_id)?.name : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <IconRenderer name={cat.icon} className="h-4 w-4" style={{ color: cat.color }} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {editingBudget && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${editingBudget.category?.color}20` }}
                >
                  <IconRenderer
                    name={editingBudget.category?.icon ?? "Tag"}
                    className="h-5 w-5"
                    style={{ color: editingBudget.category?.color }}
                  />
                </div>
                <span className="font-medium">{editingBudget.category?.name}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label>Hạn mức (VND)</Label>
              <CurrencyInput
                value={formData.amount}
                onChange={(v) => setFormData({ ...formData, amount: v })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Chu kỳ</Label>
              <Select
                value={formData.period}
                onValueChange={(v) => v && setFormData({ ...formData, period: v as BudgetPeriod })}
              >
                <SelectTrigger>
                  <SelectValue>
                    {PERIOD_OPTIONS.find((p) => p.value === formData.period)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingBudget(null); }}>Hủy</Button>
            {editingBudget ? (
              <Button onClick={handleEdit} disabled={!formData.amount}>Cập nhật</Button>
            ) : (
              <Button onClick={handleAdd} disabled={!formData.category_id || !formData.amount}>Thêm</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingBudget} onOpenChange={(open) => !open && setDeletingBudget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>Bạn có chắc muốn xóa ngân sách này?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingBudget(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
