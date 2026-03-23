export const DEFAULT_CURRENCY = "VND";

export const EXPENSE_CATEGORIES = [
  { name: "Ăn uống", icon: "UtensilsCrossed", color: "#ef4444" },
  { name: "Di chuyển", icon: "Car", color: "#f97316" },
  { name: "Mua sắm", icon: "ShoppingBag", color: "#eab308" },
  { name: "Giải trí", icon: "Gamepad2", color: "#a855f7" },
  { name: "Học tập", icon: "GraduationCap", color: "#3b82f6" },
  { name: "Sức khỏe", icon: "Heart", color: "#ec4899" },
  { name: "Nhà ở", icon: "Home", color: "#14b8a6" },
  { name: "Hóa đơn", icon: "Receipt", color: "#64748b" },
  { name: "Quần áo", icon: "Shirt", color: "#8b5cf6" },
  { name: "Khác", icon: "MoreHorizontal", color: "#6b7280" },
] as const;

export const INCOME_CATEGORIES = [
  { name: "Lương", icon: "Banknote", color: "#22c55e" },
  { name: "Thưởng", icon: "Gift", color: "#10b981" },
  { name: "Đầu tư", icon: "TrendingUp", color: "#06b6d4" },
  { name: "Thu nhập phụ", icon: "Briefcase", color: "#8b5cf6" },
  { name: "Khác", icon: "MoreHorizontal", color: "#6b7280" },
] as const;

export const WALLET_TYPES = [
  { value: "cash" as const, label: "Tiền mặt", icon: "Wallet" },
  { value: "bank" as const, label: "Ngân hàng", icon: "Building2" },
  { value: "ewallet" as const, label: "Ví điện tử", icon: "Smartphone" },
  { value: "credit" as const, label: "Thẻ tín dụng", icon: "CreditCard" },
] as const;

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

/**
 * Tính khoảng thời gian "tháng" dựa trên ngày bắt đầu tùy chỉnh.
 * VD: monthStartDay = 25, hôm nay 28/3 → 25/3 - 24/4
 *     monthStartDay = 25, hôm nay 20/3 → 25/2 - 24/3
 *     monthStartDay = 1 (mặc định) → 1/3 - 31/3
 */
export function getMonthRange(
  date: Date,
  monthStartDay: number = 1
): { start: Date; end: Date } {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-indexed

  if (monthStartDay <= 1) {
    // Default: calendar month
    return {
      start: new Date(y, m, 1),
      end: new Date(y, m + 1, 0), // last day of month
    };
  }

  const day = date.getDate();

  if (day >= monthStartDay) {
    // Current period: monthStartDay of this month → monthStartDay-1 of next month
    return {
      start: new Date(y, m, monthStartDay),
      end: new Date(y, m + 1, monthStartDay - 1),
    };
  } else {
    // Previous period: monthStartDay of last month → monthStartDay-1 of this month
    return {
      start: new Date(y, m - 1, monthStartDay),
      end: new Date(y, m, monthStartDay - 1),
    };
  }
}
