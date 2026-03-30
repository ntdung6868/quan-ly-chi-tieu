import "server-only";

import { QueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/server";
import { queryKeys } from "@/lib/query-keys";
import type { Transaction, Wallet, Category, Profile } from "@/types";
import type { TransactionFilters } from "@/lib/services/transaction.service";

const PAGE_SIZE = 20;

// ─── Server fetch functions ─────────────────────────────────────
// Dùng server Supabase client (cookie auth) — chạy trên server only.

export async function fetchProfileServer(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function fetchTransactionsServer(
  filters: TransactionFilters,
  options?: { limit?: number }
): Promise<Transaction[]> {
  const supabase = await createClient();

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
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Transaction[];
}

export async function fetchTransactionPageServer(
  filters: TransactionFilters,
  offset: number = 0
): Promise<{ data: Transaction[]; hasMore: boolean }> {
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select("*, category:categories(*), wallet:wallets(*)")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (filters.walletId) query = query.eq("wallet_id", filters.walletId);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.startDate) query = query.gte("transaction_date", filters.startDate);
  if (filters.endDate) query = query.lte("transaction_date", filters.endDate);
  if (filters.search) query = query.ilike("note", `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const items = (data ?? []) as Transaction[];
  return { data: items, hasMore: items.length >= PAGE_SIZE };
}

export async function fetchWalletsServer(): Promise<Wallet[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Wallet[];
}

export async function fetchCategoriesServer(type?: "income" | "expense"): Promise<Category[]> {
  const supabase = await createClient();
  let query = supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

export async function fetchBudgetsServer() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("*, category:categories(*)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchReportTransactionsServer(range: {
  start: string;
  end: string;
}): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, category:categories(*), wallet:wallets(*)")
    .gte("transaction_date", range.start)
    .lte("transaction_date", range.end)
    .order("transaction_date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Transaction[];
}

// ─── Reusable Prefetch Helpers ──────────────────────────────────
// Gọi từ Server Component page.tsx — prefetch data dùng chung
// giữa nhiều trang để DRY.

/**
 * Prefetch dữ liệu dùng chung: wallets + categories (all types).
 * Gọi ở bất kỳ trang nào cần danh sách ví và danh mục.
 */
export async function prefetchCommonData(queryClient: QueryClient) {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.wallets.all,
      queryFn: fetchWalletsServer,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.categories.byType(undefined),
      queryFn: () => fetchCategoriesServer(),
    }),
  ]);
}

/**
 * Prefetch toàn bộ dữ liệu cho Dashboard:
 * transactions (tháng hiện tại) + wallets + categories.
 */
export async function prefetchDashboard(
  queryClient: QueryClient,
  filters: TransactionFilters
) {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.transactions.list(filters),
      queryFn: () => fetchTransactionsServer(filters),
    }),
    prefetchCommonData(queryClient),
  ]);
}

/**
 * Prefetch trang đầu tiên của infinite query cho /transactions.
 * Khi client hydrate, useInfiniteQuery sẽ nhận page đầu ngay.
 */
export async function prefetchTransactionList(
  queryClient: QueryClient,
  filters: TransactionFilters
) {
  await Promise.all([
    queryClient.prefetchInfiniteQuery({
      queryKey: queryKeys.transactions.paginated(filters),
      queryFn: () => fetchTransactionPageServer(filters, 0),
      initialPageParam: 0,
    }),
    prefetchCommonData(queryClient),
  ]);
}

/**
 * Prefetch dữ liệu cho /reports:
 * transactions theo preset + transactions cả năm (cho biểu đồ so sánh).
 */
export async function prefetchReport(
  queryClient: QueryClient,
  range: { start: string; end: string },
  yearRange: { start: string; end: string }
) {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["reports", "this_month", range],
      queryFn: () => fetchReportTransactionsServer(range),
    }),
    queryClient.prefetchQuery({
      queryKey: ["reports", "year", yearRange],
      queryFn: () => fetchReportTransactionsServer(yearRange),
    }),
  ]);
}

/**
 * Prefetch dữ liệu cho /budgets:
 * budgets + expense categories.
 */
export async function prefetchBudgets(queryClient: QueryClient) {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.budgets.all,
      queryFn: fetchBudgetsServer,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.categories.byType("expense"),
      queryFn: () => fetchCategoriesServer("expense"),
    }),
  ]);
}
