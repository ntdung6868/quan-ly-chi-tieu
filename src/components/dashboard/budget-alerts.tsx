"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IconRenderer } from "@/components/shared/icon-renderer";
import { formatCurrency, getMonthRange } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useBudgets } from "@/hooks/use-budgets";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, startOfYear, endOfYear } from "date-fns";
import Link from "next/link";
import type { BudgetPeriod } from "@/types";

interface BudgetAlert {
  id: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  spent: number;
  percent: number;
  isOver: boolean;
}

function getPeriodRange(period: BudgetPeriod, monthStartDay: number): { start: string; end: string } {
  const now = new Date();
  switch (period) {
    case "weekly":
      return { start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"), end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd") };
    case "monthly": {
      const r = getMonthRange(now, monthStartDay);
      return { start: format(r.start, "yyyy-MM-dd"), end: format(r.end, "yyyy-MM-dd") };
    }
    case "yearly":
      return { start: format(startOfYear(now), "yyyy-MM-dd"), end: format(endOfYear(now), "yyyy-MM-dd") };
  }
}

export function BudgetAlerts() {
  const { profile } = useAuth();
  const { budgets } = useBudgets();
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    async function checkBudgets() {
      if (budgets.length === 0) return;

      const monthStartDay = profile?.month_start_day ?? 1;

      // Collect all category IDs and find the widest date range needed
      const categoryIds = budgets.map((b) => b.category_id);
      let minStart = "9999-12-31";
      let maxEnd = "0000-01-01";
      const budgetRanges = new Map<string, { start: string; end: string }>();

      for (const budget of budgets) {
        const range = getPeriodRange(budget.period, monthStartDay);
        budgetRanges.set(budget.id, range);
        if (range.start < minStart) minStart = range.start;
        if (range.end > maxEnd) maxEnd = range.end;
      }

      // Single batch query for all categories in widest range
      const { data: allTxs } = await supabaseRef.current
        .from("transactions")
        .select("category_id, amount, transaction_date")
        .eq("type", "expense")
        .in("category_id", categoryIds)
        .gte("transaction_date", minStart)
        .lte("transaction_date", maxEnd);

      const txs = allTxs ?? [];

      const results: BudgetAlert[] = [];

      for (const budget of budgets) {
        const range = budgetRanges.get(budget.id)!;
        // Filter transactions for this budget's category and date range
        const spent = txs
          .filter((t: { category_id: string; amount: number; transaction_date: string }) => t.category_id === budget.category_id && t.transaction_date >= range.start && t.transaction_date <= range.end)
          .reduce((s: number, t: { amount: number }) => s + t.amount, 0);

        const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        if (percent >= 80) {
          results.push({
            id: budget.id,
            categoryName: budget.category?.name ?? "Không rõ",
            categoryIcon: budget.category?.icon ?? "Tag",
            categoryColor: budget.category?.color ?? "#6b7280",
            amount: budget.amount,
            spent,
            percent: Math.min(percent, 100),
            isOver: spent > budget.amount,
          });
        }
      }

      setAlerts(results.sort((a, b) => b.percent - a.percent));
    }

    checkBudgets();
  }, [budgets, profile?.month_start_day]);

  if (alerts.length === 0) return null;

  return (
    <Link href="/budgets" className="block">
      <Card className="border-orange-500/30 dark:border-orange-500/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span>Cảnh báo ngân sách ({alerts.length})</span>
          </div>
          {alerts.map((a) => (
            <div key={a.id} className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${a.categoryColor}20` }}
              >
                <IconRenderer name={a.categoryIcon} className="h-4 w-4" style={{ color: a.categoryColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium truncate">{a.categoryName}</span>
                  <span className={cn("font-currency shrink-0 ml-2", a.isOver ? "text-red-500" : "text-orange-500")}>
                    {formatCurrency(a.spent)} / {formatCurrency(a.amount)}
                  </span>
                </div>
                <Progress
                  value={a.percent}
                  className={cn(
                    "h-1.5",
                    a.isOver ? "[&>div]:bg-destructive" : "[&>div]:bg-orange-500"
                  )}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Link>
  );
}
