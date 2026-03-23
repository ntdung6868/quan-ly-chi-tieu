"use client";

import { useState, useMemo } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { vi } from "date-fns/locale";
import { Plus, Search, SlidersHorizontal, ArrowLeftRight, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
import { EmptyState } from "@/components/shared/empty-state";
import { TransactionListSkeleton } from "@/components/shared/skeleton-list";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { useWallets } from "@/hooks/use-wallets";
import { useAuth } from "@/hooks/use-auth";
import { getMonthRange } from "@/lib/constants";
import { toast } from "sonner";
import type { Transaction, TransactionType } from "@/types";

export default function TransactionsPage() {
  const { profile } = useAuth();
  const monthStartDay = profile?.month_start_day ?? 1;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<TransactionType | "all">("all");
  const [filterWallet, setFilterWallet] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const monthRange = useMemo(() => getMonthRange(currentMonth, monthStartDay), [currentMonth, monthStartDay]);
  const startDate = format(monthRange.start, "yyyy-MM-dd");
  const endDate = format(monthRange.end, "yyyy-MM-dd");

  const isCurrentMonth = getMonthRange(new Date(), monthStartDay).start.getTime() === monthRange.start.getTime();

  const { grouped, loading: txLoading, loadingMore, hasMore, loadMore, addTransaction, updateTransaction, deleteTransaction, refetch } =
    useTransactions({
      startDate,
      endDate,
      type: filterType === "all" ? undefined : filterType,
      walletId: filterWallet === "all" ? undefined : filterWallet,
      paginate: true,
      search: search || undefined,
    });

  const { categories } = useCategories();
  const { wallets, refetch: refetchWallets } = useWallets();

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

  async function handleEdit(data: Parameters<typeof addTransaction>[0]) {
    if (!editingTx) return;
    setFormLoading(true);
    try {
      const { error } = await updateTransaction(editingTx.id, data);
      if (error) {
        toast.error("Cập nhật thất bại", { description: error.message });
      } else {
        toast.success("Đã cập nhật giao dịch");
        setEditingTx(null);
        refetch();
        refetchWallets();
      }
    } catch (err) {
      toast.error("Lỗi không xác định", { description: String(err) });
    }
    setFormLoading(false);
  }

  async function handleDelete() {
    if (!deletingTx) return;
    try {
      const { error } = await deleteTransaction(deletingTx.id);
      if (error) {
        toast.error("Xóa thất bại", { description: error.message });
      } else {
        toast.success("Đã xóa giao dịch");
        setDeletingTx(null);
        refetch();
        refetchWallets();
      }
    } catch (err) {
      toast.error("Lỗi không xác định", { description: String(err) });
    }
  }

  function handleTransactionClick(tx: Transaction) {
    setEditingTx(tx);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Giao dịch</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm mới
        </Button>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <button
          className="text-sm font-medium hover:text-primary transition-colors"
          onClick={() => setCurrentMonth(new Date())}
        >
          {format(monthRange.start, "dd/MM")} - {format(monthRange.end, "dd/MM/yyyy")}
          {isCurrentMonth && <span className="ml-1.5 text-xs text-muted-foreground">(Hiện tại)</span>}
        </button>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => addMonths(m, 1))} disabled={isCurrentMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm ghi chú..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={(v) => v && setFilterType(v as TransactionType | "all")}>
          <SelectTrigger className="w-full sm:w-40">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue>
              {filterType === "all" ? "Tất cả" : filterType === "expense" ? "Chi tiêu" : "Thu nhập"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="expense">Chi tiêu</SelectItem>
            <SelectItem value="income">Thu nhập</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterWallet} onValueChange={(v) => v && setFilterWallet(v)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Tất cả ví">
              {filterWallet === "all" ? "Tất cả ví" : wallets.find((w) => w.id === filterWallet)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả ví</SelectItem>
            {wallets.map((w) => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {txLoading ? (
        <TransactionListSkeleton />
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Chưa có giao dịch"
          description="Bắt đầu ghi lại các khoản thu chi của bạn"
        >
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm giao dịch đầu tiên
          </Button>
        </EmptyState>
      ) : (
        <>
          <TransactionList groups={grouped} onTransactionClick={handleTransactionClick} />
          {hasMore && (
            <div className="flex justify-center pt-2 pb-4">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Đang tải..." : "Xem thêm"}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Add Transaction Sheet */}
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

      {/* Edit Transaction Sheet */}
      <Sheet open={!!editingTx} onOpenChange={(open) => !open && setEditingTx(null)}>
        <SheetContent side="bottom" className="h-[90dvh] sm:h-auto sm:max-h-[90dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Sửa giao dịch</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {editingTx && (
              <>
                <TransactionForm
                  categories={categories}
                  wallets={wallets}
                  initialData={editingTx}
                  onSubmit={handleEdit}
                  onCancel={() => setEditingTx(null)}
                  loading={formLoading}
                />
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      setDeletingTx(editingTx);
                      setEditingTx(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa giao dịch
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingTx} onOpenChange={(open) => !open && setDeletingTx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa giao dịch này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTx(null)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
