import { createClient } from "@/lib/supabase/client";
import type { Transaction } from "@/types";

// ─── Types (chỉ dùng cho Read queries) ──────────────────────────
export interface TransactionFilters {
  walletId?: string;
  categoryId?: string;
  type?: "income" | "expense";
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
}

const PAGE_SIZE = 20;

// ─── Query builder (private) ────────────────────────────────────
function buildQuery(supabase: ReturnType<typeof createClient>, filters: TransactionFilters) {
  let query = supabase
    .from("transactions")
    .select("*, category:categories(*), wallet:wallets(*)")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.walletId) query = query.eq("wallet_id", filters.walletId);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.startDate) query = query.gte("transaction_date", filters.startDate);
  if (filters.endDate) query = query.lte("transaction_date", filters.endDate);
  if (filters.search) query = query.ilike("note", `%${filters.search}%`);

  return query;
}

// ─── Read-only service functions ────────────────────────────────
// Mutations đã chuyển sang Server Actions (src/lib/actions/)

export async function fetchTransactions(
  filters: TransactionFilters,
  options?: { limit?: number }
): Promise<Transaction[]> {
  const supabase = createClient();
  let query = buildQuery(supabase, filters);

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Transaction[];
}

export async function fetchTransactionPage(
  filters: TransactionFilters,
  offset: number
): Promise<PaginatedResult<Transaction>> {
  const supabase = createClient();
  const query = buildQuery(supabase, filters).range(offset, offset + PAGE_SIZE - 1);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const items = (data ?? []) as Transaction[];
  return { data: items, hasMore: items.length >= PAGE_SIZE };
}

export { PAGE_SIZE };
