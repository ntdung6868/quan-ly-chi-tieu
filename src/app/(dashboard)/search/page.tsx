"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, ArrowLeftRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TransactionCard } from "@/components/transactions/transaction-card";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/constants";
import type { Transaction } from "@/types";

const PAGE_SIZE = 20;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const supabaseRef = useRef(createClient());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSearch = useCallback(async (q: string, offset = 0) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabaseRef.current
        .from("transactions")
        .select("*, category:categories(*), wallet:wallets(*)")
        .ilike("note", `%${q.trim()}%`)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        console.error("Search error:", error.message);
      } else {
        const items = (data ?? []) as Transaction[];
        if (offset === 0) {
          setResults(items);
        } else {
          setResults((prev) => [...prev, ...items]);
        }
        setHasMore(items.length >= PAGE_SIZE);
      }
    } catch (err) {
      console.error("Search exception:", err);
    }
    setSearched(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const totalIncome = results.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = results.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // Group by date
  const grouped = results.reduce<Record<string, Transaction[]>>((acc, tx) => {
    (acc[tx.transaction_date] ??= []).push(tx);
    return acc;
  }, {});

  const formatGroupDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isThisYear = d.getFullYear() === now.getFullYear();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return isThisYear ? `${dd}/${mm}` : `${dd}/${mm}/${d.getFullYear()}`;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tìm kiếm</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm ghi chú giao dịch..."
          className="pl-10 pr-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setQuery("")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {searched && results.length > 0 && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{results.length}{hasMore ? "+" : ""} kết quả</span>
          {totalIncome > 0 && <span className="text-green-500 font-currency">+{formatCurrency(totalIncome)}</span>}
          {totalExpense > 0 && <span className="text-red-500 font-currency">-{formatCurrency(totalExpense)}</span>}
        </div>
      )}

      {loading && !results.length ? (
        <div className="text-center py-12 text-muted-foreground">Đang tìm...</div>
      ) : searched && results.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Không tìm thấy"
          description={`Không có giao dịch nào chứa "${query}"`}
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, txs]) => (
            <div key={date}>
              <div className="px-3 py-2">
                <span className="text-sm font-medium text-muted-foreground">{formatGroupDate(date)}</span>
              </div>
              <div className="rounded-xl border bg-card divide-y">
                {txs.map((tx) => (
                  <TransactionCard key={tx.id} transaction={tx} />
                ))}
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2 pb-4">
              <Button
                variant="outline"
                onClick={() => doSearch(query, results.length)}
                disabled={loading}
              >
                {loading ? "Đang tải..." : "Xem thêm"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
