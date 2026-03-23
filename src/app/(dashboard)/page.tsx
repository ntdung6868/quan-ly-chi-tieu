"use client";

import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetAlerts } from "@/components/dashboard/budget-alerts";
import { SummarySkeleton, ChartSkeleton } from "@/components/shared/skeleton-list";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { useWallets } from "@/hooks/use-wallets";
import { useAuth } from "@/hooks/use-auth";
import { getMonthRange } from "@/lib/constants";
import { toast } from "sonner";

export default function DashboardPage() {
  const now = new Date();
  const { profile } = useAuth();
  const monthRange = getMonthRange(now, profile?.month_start_day ?? 1);
  const startDate = format(monthRange.start, "yyyy-MM-dd");
  const endDate = format(monthRange.end, "yyyy-MM-dd");
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const { transactions, loading: txLoading, addTransaction, refetch } = useTransactions({ startDate, endDate });
  const { categories } = useCategories();
  const { wallets, refetch: refetchWallets } = useWallets();

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  async function handleAdd(data: Parameters<typeof addTransaction>[0]) {
    setFormLoading(true);
    try {
      const { error } = await addTransaction(data);
      if (error) {
        toast.error("Thêm giao dịch thất bại", { description: error.message });
      } else {
        toast.success("Đã thêm giao dịch");
        setShowForm(false);
        refetch();
        refetchWallets();
      }
    } catch (err) {
      toast.error("Lỗi không xác định", { description: String(err) });
    }
    setFormLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tổng quan</h1>
          <p className="text-sm text-muted-foreground">
            Tháng {format(now, "MM/yyyy", { locale: vi })}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="hidden sm:flex">
          <Plus className="h-4 w-4 mr-2" />
          Thêm giao dịch
        </Button>
      </div>

      {txLoading && transactions.length === 0 ? (
        <>
          <SummarySkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </>
      ) : (
        <>
          <SummaryCards
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={totalIncome - totalExpense}
          />

          <BudgetAlerts />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseChart transactions={transactions} />
            <RecentTransactions transactions={transactions} />
          </div>
        </>
      )}

      {/* FAB for mobile */}
      <Button
        onClick={() => setShowForm(true)}
        className="fixed right-4 h-14 w-14 rounded-full shadow-lg sm:hidden z-40"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 6.8rem)" }}
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent side="bottom" className="h-[90dvh] sm:h-auto sm:max-h-[90dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Thêm giao dịch</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <TransactionForm
              categories={categories}
              wallets={wallets}
              onSubmit={handleAdd}
              onCancel={() => setShowForm(false)}
              loading={formLoading}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
