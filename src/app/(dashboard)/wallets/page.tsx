"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Wallet as WalletIcon, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatCurrency, WALLET_TYPES } from "@/lib/constants";
import { CardListSkeleton } from "@/components/shared/skeleton-list";
import { useWallets } from "@/hooks/use-wallets";
import { createClient, getCachedUserId } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Wallet, WalletType } from "@/types";

const COLOR_OPTIONS = [
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#f97316",
  "#ef4444", "#14b8a6", "#06b6d4", "#eab308", "#64748b",
];

export default function WalletsPage() {
  const { wallets, totalBalance, loading: walletsLoading, addWallet, updateWallet, deleteWallet, refetch } = useWallets();
  const [showForm, setShowForm] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [deletingWallet, setDeletingWallet] = useState<Wallet | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "cash" as WalletType,
    icon: "Wallet",
    color: "#22c55e",
    balance: 0,
  });
  const [transfer, setTransfer] = useState({ from: "", to: "", amount: 0 });

  function openAdd() {
    setFormData({ name: "", type: "cash", icon: "Wallet", color: "#22c55e", balance: 0 });
    setEditingWallet(null);
    setShowForm(true);
  }

  function openEdit(w: Wallet) {
    setFormData({ name: w.name, type: w.type, icon: w.icon, color: w.color, balance: w.balance });
    setEditingWallet(w);
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!formData.name.trim()) return;

    try {
      if (editingWallet) {
        const { error } = await updateWallet(editingWallet.id, {
          name: formData.name,
          type: formData.type,
          icon: formData.icon,
          color: formData.color,
        });
        if (error) {
          toast.error("Cập nhật thất bại", { description: String(error.message ?? error) });
          return;
        }
        toast.success("Đã cập nhật ví");
      } else {
        const { error } = await addWallet(formData);
        if (error) {
          toast.error("Thêm thất bại", { description: String(error.message ?? error) });
          return;
        }
        toast.success("Đã thêm ví");
      }
      setShowForm(false);
    } catch (err) {
      toast.error("Lỗi không xác định", { description: String(err) });
    }
  }

  async function handleDelete() {
    if (!deletingWallet) return;
    try {
      const { error } = await deleteWallet(deletingWallet.id);
      if (error) toast.error("Xóa thất bại", { description: error.message });
      else toast.success("Đã xóa ví");
    } catch (err) {
      toast.error("Lỗi khi xóa", { description: String(err) });
    }
    setDeletingWallet(null);
  }

  async function handleTransfer() {
    if (!transfer.from || !transfer.to || !transfer.amount || transfer.from === transfer.to) return;

    try {
      const fromWallet = wallets.find((w) => w.id === transfer.from);
      const toWallet = wallets.find((w) => w.id === transfer.to);
      if (!fromWallet || !toWallet) return;

      if (fromWallet.balance < transfer.amount) {
        toast.error("Số dư không đủ", {
          description: `Ví "${fromWallet.name}" chỉ còn ${formatCurrency(fromWallet.balance)}`,
        });
        return;
      }

      const supabase = createClient();
      // Use RPC for atomic transfer (both updates in one transaction)
      const { error } = await supabase.rpc("transfer_between_wallets", {
        from_wallet_id: transfer.from,
        to_wallet_id: transfer.to,
        transfer_amount: transfer.amount,
      });

      if (error) {
        // Fallback to sequential updates if RPC not available
        if (error.message?.includes("function") || error.code === "42883") {
          const { error: e1 } = await supabase
            .from("wallets")
            .update({ balance: fromWallet.balance - transfer.amount })
            .eq("id", transfer.from);
          const { error: e2 } = await supabase
            .from("wallets")
            .update({ balance: toWallet.balance + transfer.amount })
            .eq("id", transfer.to);
          if (e1 || e2) {
            toast.error("Chuyển tiền thất bại", { description: (e1 || e2)?.message });
            return;
          }
        } else {
          toast.error("Chuyển tiền thất bại", { description: error.message });
          return;
        }
      }

      toast.success(`Đã chuyển ${formatCurrency(transfer.amount)}`);
      setShowTransfer(false);
      setTransfer({ from: "", to: "", amount: 0 });
      refetch();
    } catch (err) {
      toast.error("Lỗi không xác định", { description: String(err) });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ví</h1>
          <p className="text-sm text-muted-foreground">
            Tổng số dư: <span className="font-semibold text-foreground font-currency">{formatCurrency(totalBalance)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTransfer(true)}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Chuyển tiền
          </Button>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm ví
          </Button>
        </div>
      </div>

      {walletsLoading && wallets.length === 0 ? (
        <CardListSkeleton rows={3} />
      ) : wallets.length === 0 ? (
        <EmptyState icon={WalletIcon} title="Chưa có ví" description="Tạo ví đầu tiên để bắt đầu">
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm ví
          </Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallets.map((w) => (
            <Card key={w.id} className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: w.color }} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-11 w-11 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${w.color}20` }}
                    >
                      <IconRenderer name={w.icon} className="h-5 w-5" style={{ color: w.color }} />
                    </div>
                    <div>
                      <p className="font-medium">{w.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {WALLET_TYPES.find((t) => t.value === w.type)?.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(w)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeletingWallet(w)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-2xl font-bold mt-4 font-currency">{formatCurrency(w.balance)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Wallet Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWallet ? "Sửa ví" : "Thêm ví mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên ví</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Ngân hàng Vietcombank"
              />
            </div>
            <div className="space-y-2">
              <Label>Loại ví</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => {
                  if (!v) return;
                  const wt = WALLET_TYPES.find((t) => t.value === v);
                  setFormData({ ...formData, type: v as WalletType, icon: wt?.icon ?? "Wallet" });
                }}
              >
                <SelectTrigger>
                  <SelectValue>
                    {WALLET_TYPES.find((t) => t.value === formData.type)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {WALLET_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <IconRenderer name={t.icon} className="h-4 w-4" />
                        {t.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editingWallet && (
              <div className="space-y-2">
                <Label>Số dư ban đầu (VND)</Label>
                <CurrencyInput
                  value={formData.balance}
                  onChange={(v) => setFormData({ ...formData, balance: v })}
                  placeholder="0"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Màu sắc</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      formData.color === color ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
              {editingWallet ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="pr-8">Chuyển tiền giữa các ví</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Từ ví</Label>
              <Select value={transfer.from} onValueChange={(v) => v && setTransfer({ ...transfer, from: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn ví nguồn">
                    {transfer.from ? (() => { const w = wallets.find((w) => w.id === transfer.from); return w ? `${w.name} (${formatCurrency(w.balance)})` : undefined; })() : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} className="min-w-70">
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Đến ví</Label>
              <Select value={transfer.to} onValueChange={(v) => v && setTransfer({ ...transfer, to: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn ví đích">
                    {transfer.to ? (() => { const w = wallets.find((w) => w.id === transfer.to); return w ? `${w.name} (${formatCurrency(w.balance)})` : undefined; })() : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} className="min-w-70">
                  {wallets.filter((w) => w.id !== transfer.from).map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Số tiền (VND)</Label>
              <CurrencyInput
                value={transfer.amount}
                onChange={(v) => setTransfer({ ...transfer, amount: v })}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransfer(false)}>Hủy</Button>
            <Button
              onClick={handleTransfer}
              disabled={!transfer.from || !transfer.to || !transfer.amount || transfer.from === transfer.to}
            >
              Chuyển
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingWallet} onOpenChange={(open) => !open && setDeletingWallet(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa ví &quot;{deletingWallet?.name}&quot;? Tất cả giao dịch trong ví sẽ bị xóa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingWallet(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
