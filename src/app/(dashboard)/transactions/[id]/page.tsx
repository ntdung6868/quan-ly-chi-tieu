"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { IconRenderer } from "@/components/shared/icon-renderer";
import { formatCurrency } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useCategories } from "@/hooks/use-categories";
import { useWallets } from "@/hooks/use-wallets";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Transaction } from "@/types";

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const { categories } = useCategories();
  const { wallets } = useWallets();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    async function fetchTransaction() {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, category:categories(*), wallet:wallets(*)")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Fetch transaction detail error:", error.message);
      }
      setTransaction(data as Transaction | null);
      setLoading(false);
    }
    fetchTransaction();
  }, [id, supabase]);

  async function handleEdit(data: {
    amount: number;
    type: "income" | "expense";
    category_id: string;
    wallet_id: string;
    note: string;
    transaction_date: string;
  }) {
    setFormLoading(true);
    try {
      const { error } = await supabase
        .from("transactions")
        .update(data)
        .eq("id", id);

      if (error) {
        toast.error("Cập nhật thất bại", { description: error.message });
      } else {
        toast.success("Đã cập nhật");
        setShowEdit(false);
        router.push("/transactions");
      }
    } catch (err) {
      toast.error("Lỗi không xác định", { description: String(err) });
    }
    setFormLoading(false);
  }

  async function handleDelete() {
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) {
        toast.error("Xóa thất bại", { description: error.message });
      } else {
        toast.success("Đã xóa giao dịch");
        router.push("/transactions");
      }
    } catch (err) {
      toast.error("Lỗi không xác định", { description: String(err) });
    }
  }

  if (loading) return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <div className="animate-pulse h-9 w-9 rounded-md bg-muted" />
        <div className="animate-pulse h-5 w-40 rounded-md bg-muted" />
      </div>
      <div className="rounded-xl border bg-card p-6 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-pulse h-16 w-16 rounded-full bg-muted" />
          <div className="animate-pulse h-8 w-40 rounded-md bg-muted" />
          <div className="animate-pulse h-4 w-24 rounded-md bg-muted" />
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex justify-between">
              <div className="animate-pulse h-4 w-20 rounded-md bg-muted" />
              <div className="animate-pulse h-4 w-28 rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  if (!transaction) return <div className="text-center py-12 text-muted-foreground">Không tìm thấy giao dịch</div>;

  const isExpense = transaction.type === "expense";

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Chi tiết giao dịch</h1>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${transaction.category?.color}20` }}
            >
              <IconRenderer
                name={transaction.category?.icon ?? "HelpCircle"}
                className="h-8 w-8"
                style={{ color: transaction.category?.color }}
              />
            </div>
            <p
              className={cn(
                "text-3xl font-bold font-currency",
                isExpense ? "text-red-500" : "text-green-500"
              )}
            >
              {isExpense ? "-" : "+"}{formatCurrency(transaction.amount)}
            </p>
            <p className="text-muted-foreground">{transaction.category?.name}</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loại</span>
              <span className="font-medium">{isExpense ? "Chi tiêu" : "Thu nhập"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ví</span>
              <span className="font-medium">{transaction.wallet?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ngày</span>
              <span className="font-medium">
                {format(new Date(transaction.transaction_date), "EEEE, dd/MM/yyyy", { locale: vi })}
              </span>
            </div>
            {transaction.note && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ghi chú</span>
                <span className="font-medium text-right max-w-[200px]">{transaction.note}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowEdit(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Sửa
            </Button>
            <Button variant="destructive" className="flex-1" onClick={() => setShowDelete(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </Button>
          </div>
        </CardContent>
      </Card>

      <Sheet open={showEdit} onOpenChange={setShowEdit}>
        <SheetContent side="bottom" className="h-[90dvh] sm:h-auto sm:max-h-[90dvh] overflow-y-auto">
          <SheetHeader><SheetTitle>Sửa giao dịch</SheetTitle></SheetHeader>
          <div className="mt-4">
            <TransactionForm
              categories={categories}
              wallets={wallets}
              initialData={transaction}
              onSubmit={handleEdit}
              onCancel={() => setShowEdit(false)}
              loading={formLoading}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>Bạn có chắc muốn xóa giao dịch này?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
