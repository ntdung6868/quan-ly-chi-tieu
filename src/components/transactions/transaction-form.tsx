"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/currency-input";
import { IconRenderer } from "@/components/shared/icon-renderer";
import { cn } from "@/lib/utils";
import type { Category, Transaction, TransactionType, Wallet } from "@/types";

interface TransactionFormProps {
  categories: Category[];
  wallets: Wallet[];
  initialData?: Transaction;
  onSubmit: (data: {
    amount: number;
    type: TransactionType;
    category_id: string;
    wallet_id: string;
    note: string;
    transaction_date: string;
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function TransactionForm({
  categories,
  wallets,
  initialData,
  onSubmit,
  onCancel,
  loading,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initialData?.type ?? "expense");
  const [amount, setAmount] = useState(initialData?.amount ?? 0);
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? "");
  const [walletId, setWalletId] = useState(initialData?.wallet_id ?? "");
  const [note, setNote] = useState(initialData?.note ?? "");
  const [date, setDate] = useState<Date>(
    initialData?.transaction_date ? new Date(initialData.transaction_date) : new Date()
  );

  useEffect(() => {
    if (walletId || wallets.length === 0) return;
    const defaultWallet = wallets.find((w) => w.is_default) ?? wallets[0];
    if (defaultWallet) setWalletId(defaultWallet.id);
  }, [wallets, walletId]);

  const filteredCategories = categories.filter((c) => c.type === type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !categoryId || !walletId) return;

    await onSubmit({
      amount,
      type,
      category_id: categoryId,
      wallet_id: walletId,
      note,
      transaction_date: format(date, "yyyy-MM-dd"),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={type === "expense" ? "default" : "outline"}
          className={cn(type === "expense" && "bg-red-500 hover:bg-red-600")}
          onClick={() => { setType("expense"); setCategoryId(""); }}
        >
          Chi tiêu
        </Button>
        <Button
          type="button"
          variant={type === "income" ? "default" : "outline"}
          className={cn(type === "income" && "bg-green-500 hover:bg-green-600")}
          onClick={() => { setType("income"); setCategoryId(""); }}
        >
          Thu nhập
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Số tiền (VND)</Label>
        <CurrencyInput
          value={amount}
          onChange={setAmount}
          placeholder="0"
          className="text-lg font-semibold"
        />
      </div>

      <div className="space-y-2">
        <Label>Danh mục</Label>
        <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn danh mục">
              {categoryId ? filteredCategories.find((c) => c.id === categoryId)?.name : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.length === 0 ? (
              <div className="py-2 px-3 text-sm text-muted-foreground">
                Chưa có danh mục
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <IconRenderer name={cat.icon} className="h-4 w-4" style={{ color: cat.color }} />
                    {cat.name}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Ví</Label>
        <Select value={walletId} onValueChange={(v) => v && setWalletId(v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn ví">
              {walletId ? wallets.find((w) => w.id === walletId)?.name : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {wallets.length === 0 ? (
              <div className="py-2 px-3 text-sm text-muted-foreground">
                Chưa có ví
              </div>
            ) : (
              wallets.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  <div className="flex items-center gap-2">
                    <IconRenderer name={w.icon} className="h-4 w-4" style={{ color: w.color }} />
                    {w.name}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Ngày</Label>
        <Popover>
          <PopoverTrigger
            render={<Button variant="outline" className="w-full justify-start text-left font-normal" />}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(date, "dd/MM/yyyy", { locale: vi })}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              locale={vi}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Ghi chú</Label>
        <Textarea
          placeholder="Thêm ghi chú..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" className="flex-1" disabled={loading || !amount || !categoryId || !walletId}>
          {loading ? "Đang lưu..." : initialData ? "Cập nhật" : "Thêm"}
        </Button>
      </div>
    </form>
  );
}
