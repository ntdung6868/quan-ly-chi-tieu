"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { IconRenderer } from "@/components/shared/icon-renderer";
import { EmptyState } from "@/components/shared/empty-state";
import { useCategories } from "@/hooks/use-categories";
import { toast } from "sonner";
import type { Category, TransactionType } from "@/types";

const ICON_OPTIONS = [
  "UtensilsCrossed", "Car", "ShoppingBag", "Gamepad2", "GraduationCap",
  "Heart", "Home", "Receipt", "Shirt", "Banknote", "Gift", "TrendingUp",
  "Briefcase", "Coffee", "Plane", "Phone", "Tv", "Music", "Dumbbell",
  "Baby", "Dog", "Scissors", "Wrench", "Fuel", "Bus", "Train",
  "ShoppingCart", "CreditCard", "Landmark", "Stethoscope",
];

const COLOR_OPTIONS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899",
  "#f43f5e", "#64748b", "#78716c",
];

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", type: "expense" as TransactionType, icon: "Tag", color: "#3b82f6" });

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  function openAdd(type: TransactionType) {
    setFormData({ name: "", type, icon: "Tag", color: "#3b82f6" });
    setEditingCat(null);
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setFormData({ name: cat.name, type: cat.type, icon: cat.icon, color: cat.color });
    setEditingCat(cat);
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!formData.name.trim()) return;

    try {
      if (editingCat) {
        const { error } = await updateCategory(editingCat.id, formData);
        if (error) { toast.error("Cập nhật thất bại", { description: error.message }); return; }
        toast.success("Đã cập nhật danh mục");
      } else {
        const { error } = await addCategory(formData);
        if (error) { toast.error("Thêm thất bại", { description: error.message }); return; }
        toast.success("Đã thêm danh mục");
      }
      setShowForm(false);
    } catch (err) {
      toast.error("Lỗi không xác định", { description: String(err) });
    }
  }

  async function handleDelete() {
    if (!deletingCat) return;
    try {
      const { error } = await deleteCategory(deletingCat.id);
      if (error) toast.error("Xóa thất bại", { description: error.message });
      else toast.success("Đã xóa danh mục");
    } catch (err) {
      toast.error("Lỗi khi xóa", { description: String(err) });
    }
    setDeletingCat(null);
  }

  function renderCategoryList(cats: Category[], type: TransactionType) {
    if (cats.length === 0) {
      return (
        <EmptyState icon={Tag} title="Chưa có danh mục" description="Tạo danh mục đầu tiên">
          <Button onClick={() => openAdd(type)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Thêm
          </Button>
        </EmptyState>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cats.map((cat) => (
          <Card key={cat.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <IconRenderer name={cat.icon} className="h-5 w-5" style={{ color: cat.color }} />
                </div>
                <span className="font-medium">{cat.name}</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                {!cat.is_system && (
                  <Button variant="ghost" size="icon" onClick={() => setDeletingCat(cat)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Danh mục</h1>
      </div>

      <Tabs defaultValue="expense">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="expense">Chi tiêu ({expenseCategories.length})</TabsTrigger>
          <TabsTrigger value="income">Thu nhập ({incomeCategories.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="expense" className="space-y-4 mt-4">
          <Button onClick={() => openAdd("expense")} variant="outline" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Thêm danh mục chi
          </Button>
          {renderCategoryList(expenseCategories, "expense")}
        </TabsContent>
        <TabsContent value="income" className="space-y-4 mt-4">
          <Button onClick={() => openAdd("income")} variant="outline" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Thêm danh mục thu
          </Button>
          {renderCategoryList(incomeCategories, "income")}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCat ? "Sửa danh mục" : "Thêm danh mục"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên danh mục</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nhập tên danh mục"
              />
            </div>
            <div className="space-y-2">
              <Label>Biểu tượng</Label>
              <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto p-1">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`h-9 w-9 rounded-lg flex items-center justify-center border transition-colors ${
                      formData.icon === icon ? "border-primary bg-primary/10" : "border-transparent hover:bg-accent"
                    }`}
                  >
                    <IconRenderer name={icon} className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
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
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${formData.color}20` }}
              >
                <IconRenderer name={formData.icon} className="h-5 w-5" style={{ color: formData.color }} />
              </div>
              <span className="font-medium">{formData.name || "Xem trước"}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
              {editingCat ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingCat} onOpenChange={(open) => !open && setDeletingCat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa danh mục &quot;{deletingCat?.name}&quot;? Các giao dịch thuộc danh mục này sẽ bị ảnh hưởng.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCat(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
