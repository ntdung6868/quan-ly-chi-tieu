"use client";

import { useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  fetchTransactions,
  fetchTransactionPage,
} from "@/lib/services/transaction.service";
import type { TransactionFilters } from "@/lib/services/transaction.service";
import type { CreateTransactionInput } from "@/lib/validations/transaction";
import {
  addTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
} from "@/lib/actions/transaction.actions";
import { queryKeys, invalidateAfterTransactionChange } from "@/lib/query-keys";
import type { Transaction, TransactionGroup } from "@/types";

// ─── Options interface ──────────────────────────────────────────
interface UseTransactionsOptions {
  walletId?: string;
  categoryId?: string;
  type?: "income" | "expense";
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  paginate?: boolean;
}

// ─── Helper: group transactions by date ─────────────────────────
function groupByDate(transactions: Transaction[]): TransactionGroup[] {
  const map = new Map<string, TransactionGroup>();
  for (const tx of transactions) {
    let group = map.get(tx.transaction_date);
    if (!group) {
      group = { date: tx.transaction_date, transactions: [], total_income: 0, total_expense: 0 };
      map.set(tx.transaction_date, group);
    }
    group.transactions.push(tx);
    if (tx.type === "income") group.total_income += tx.amount;
    else group.total_expense += tx.amount;
  }
  return Array.from(map.values());
}

// ─── Main hook ──────────────────────────────────────────────────
export function useTransactions(options: UseTransactionsOptions = {}) {
  const queryClient = useQueryClient();

  const filters: TransactionFilters = {
    walletId: options.walletId,
    categoryId: options.categoryId,
    type: options.type,
    startDate: options.startDate,
    endDate: options.endDate,
    search: options.search,
  };

  // ── Queries (đọc — vẫn dùng client service, data đã prefetch từ server) ──
  const simpleQuery = useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () => fetchTransactions(filters, { limit: options.limit }),
    enabled: !options.paginate,
  });

  const infiniteQuery = useInfiniteQuery({
    queryKey: queryKeys.transactions.paginated(filters),
    queryFn: ({ pageParam = 0 }) => fetchTransactionPage(filters, pageParam),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.reduce((sum, p) => sum + p.data.length, 0) : undefined,
    initialPageParam: 0,
    enabled: !!options.paginate,
  });

  const transactions = options.paginate
    ? infiniteQuery.data?.pages.flatMap((p) => p.data) ?? []
    : simpleQuery.data ?? [];

  const loading = options.paginate ? infiniteQuery.isLoading : simpleQuery.isLoading;
  const hasMore = options.paginate ? infiniteQuery.hasNextPage ?? false : false;
  const loadingMore = infiniteQuery.isFetchingNextPage;

  const grouped = useMemo(() => groupByDate(transactions), [transactions]);

  // ── Mutations (ghi — gọi Server Actions, KHÔNG gọi Supabase từ client) ──

  const addMutation = useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const result = await addTransactionAction(input);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      invalidateAfterTransactionChange(queryClient);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const result = await updateTransactionAction(id, updates);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      invalidateAfterTransactionChange(queryClient);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTransactionAction(id);
      if (!result.success) throw new Error(result.error);
    },
    // Optimistic delete — xóa ngay khỏi UI trước khi server confirm
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });
      const previousData = queryClient.getQueriesData({ queryKey: queryKeys.transactions.all });

      queryClient.setQueriesData(
        { queryKey: queryKeys.transactions.lists() },
        (old: Transaction[] | undefined) => old?.filter((t) => t.id !== id)
      );

      return { previousData };
    },
    onError: (_err, _id, context) => {
      if (context?.previousData) {
        for (const [key, data] of context.previousData) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      invalidateAfterTransactionChange(queryClient);
    },
  });

  // ── Return interface (compatible với code cũ) ─────────────────
  return {
    transactions,
    grouped,
    loading,
    loadingMore,
    hasMore,
    loadMore: () => infiniteQuery.fetchNextPage(),
    addTransaction: async (input: CreateTransactionInput) => {
      try {
        const data = await addMutation.mutateAsync(input);
        return { data, error: null };
      } catch (err) {
        return { data: null, error: { message: err instanceof Error ? err.message : String(err) } };
      }
    },
    updateTransaction: async (id: string, updates: Record<string, unknown>) => {
      try {
        const data = await updateMutation.mutateAsync({ id, updates });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: { message: err instanceof Error ? err.message : String(err) } };
      }
    },
    deleteTransaction: async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        return { error: null };
      } catch (err) {
        return { error: { message: err instanceof Error ? err.message : String(err) } };
      }
    },
    refetch: () => {
      if (options.paginate) {
        infiniteQuery.refetch();
      } else {
        simpleQuery.refetch();
      }
    },
  };
}
