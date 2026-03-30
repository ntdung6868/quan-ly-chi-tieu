import type { TransactionFilters } from "@/lib/services/transaction.service";
import type { TransactionType } from "@/types";

// ─── Centralized Query Key Factory ──────────────────────────────
// Tập trung ở đây để các hook invalidate lẫn nhau chính xác.
//
// Mối quan hệ invalidation:
//   Transaction thay đổi → invalidate wallets (balance), budgets (spent)
//   Wallet bị xóa        → invalidate transactions (cascade delete)
//   Category bị xóa      → invalidate transactions, budgets

export const queryKeys = {
  // ── Transactions ──────────────────────────────────────────────
  transactions: {
    all: ["transactions"] as const,
    lists: () => [...queryKeys.transactions.all, "list"] as const,
    list: (filters: TransactionFilters) =>
      [...queryKeys.transactions.lists(), filters] as const,
    paginated: (filters: TransactionFilters) =>
      [...queryKeys.transactions.all, "paginated", filters] as const,
  },

  // ── Wallets ───────────────────────────────────────────────────
  wallets: {
    all: ["wallets"] as const,
  },

  // ── Categories ────────────────────────────────────────────────
  categories: {
    all: ["categories"] as const,
    byType: (type?: TransactionType) =>
      [...queryKeys.categories.all, type ?? "all"] as const,
  },

  // ── Budgets ───────────────────────────────────────────────────
  budgets: {
    all: ["budgets"] as const,
  },
};

// ─── Cross-domain invalidation helpers ──────────────────────────
// Gọi sau mutations để invalidate đúng các query liên quan.

import type { QueryClient } from "@tanstack/react-query";

/** Sau khi thêm/sửa/xóa transaction → wallet balance + budget spent thay đổi */
export function invalidateAfterTransactionChange(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
}

/** Sau khi xóa wallet → transactions bị cascade delete */
export function invalidateAfterWalletDelete(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
}

/** Sau khi xóa category → transactions + budgets bị ảnh hưởng */
export function invalidateAfterCategoryDelete(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
}
