"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient, getCachedUserId } from "@/lib/supabase/client";
import { getCached, setCache } from "@/lib/cache";
import type { Transaction, TransactionGroup } from "@/types";

const PAGE_SIZE = 20;

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

export function useTransactions(options: UseTransactionsOptions = {}) {
  const cacheKey = `txs:${options.startDate}:${options.endDate}:${options.type ?? ""}:${options.walletId ?? ""}:${options.search ?? ""}`;
  const cached = getCached<Transaction[]>(cacheKey);
  const [transactions, setTransactions] = useState<Transaction[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  function buildQuery() {
    let query = supabase
      .from("transactions")
      .select("*, category:categories(*), wallet:wallets(*)")
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (options.walletId) query = query.eq("wallet_id", options.walletId);
    if (options.categoryId) query = query.eq("category_id", options.categoryId);
    if (options.type) query = query.eq("type", options.type);
    if (options.startDate) query = query.gte("transaction_date", options.startDate);
    if (options.endDate) query = query.lte("transaction_date", options.endDate);
    if (options.search) query = query.ilike("note", `%${options.search}%`);
    return query;
  }

  const fetchTransactions = useCallback(async () => {
    const c = getCached<Transaction[]>(cacheKey);
    if (!c) setLoading(true);

    try {
      let query = buildQuery();
      if (options.paginate) {
        query = query.range(0, PAGE_SIZE - 1);
      } else if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Fetch transactions error:", error.message);
      } else {
        const items = (data ?? []) as Transaction[];
        setTransactions(items);
        setCache(cacheKey, items);
        if (options.paginate) {
          setHasMore(items.length >= PAGE_SIZE);
        }
      }
    } catch (err) {
      console.error("Fetch transactions exception:", err);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    supabase,
    options.walletId,
    options.categoryId,
    options.type,
    options.startDate,
    options.endDate,
    options.search,
    options.limit,
    options.paginate,
  ]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const from = transactions.length;
      const to = from + PAGE_SIZE - 1;
      const query = buildQuery().range(from, to);
      const { data, error } = await query;

      if (error) {
        console.error("Load more error:", error.message);
      } else {
        const items = (data ?? []) as Transaction[];
        setTransactions((prev) => [...prev, ...items]);
        setHasMore(items.length >= PAGE_SIZE);
      }
    } catch (err) {
      console.error("Load more exception:", err);
    }
    setLoadingMore(false);
  }

  function getUserId(): string | null {
    return getCachedUserId();
  }

  async function addTransaction(tx: {
    amount: number;
    type: "income" | "expense";
    category_id: string;
    wallet_id: string;
    note: string;
    transaction_date: string;
    attachment_url?: string | null;
  }) {
    try {
      const userId = getUserId();
      if (!userId) return { data: null, error: { message: "Not authenticated" } };

      const { data, error } = await supabase
        .from("transactions")
        .insert({ ...tx, user_id: userId })
        .select("*, category:categories(*), wallet:wallets(*)")
        .single();

      if (error) {
        console.error("Add transaction error:", error.message);
      } else if (data) {
        setTransactions((prev) => [data as Transaction, ...prev]);
      }
      return { data, error };
    } catch (err) {
      console.error("Add transaction exception:", err);
      return { data: null, error: { message: String(err) } };
    }
  }

  async function updateTransaction(
    id: string,
    updates: {
      amount?: number;
      type?: "income" | "expense";
      category_id?: string;
      wallet_id?: string;
      note?: string;
      transaction_date?: string;
    }
  ) {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id)
        .select("*, category:categories(*), wallet:wallets(*)")
        .single();

      if (error) {
        console.error("Update transaction error:", error.message);
      } else if (data) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? (data as Transaction) : t))
        );
      }
      return { data, error };
    } catch (err) {
      console.error("Update transaction exception:", err);
      return { data: null, error: { message: String(err) } };
    }
  }

  async function deleteTransaction(id: string) {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);
      if (error) {
        console.error("Delete transaction error:", error.message);
      } else {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
      }
      return { error };
    } catch (err) {
      console.error("Delete transaction exception:", err);
      return { error: { message: String(err) } };
    }
  }

  const grouped = useMemo(() => {
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
  }, [transactions]);

  return {
    transactions,
    grouped,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  };
}
