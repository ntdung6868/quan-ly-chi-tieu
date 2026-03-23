"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, getCachedUserId } from "@/lib/supabase/client";
import type { Budget } from "@/types";

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("budgets")
        .select("*, category:categories(*)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch budgets error:", error.message);
      } else {
        setBudgets((data ?? []) as Budget[]);
      }
    } catch (err) {
      console.error("Fetch budgets exception:", err);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  function getUserId(): string | null {
    return getCachedUserId();
  }

  async function addBudget(
    budget: Pick<
      Budget,
      "category_id" | "amount" | "period" | "start_date" | "end_date"
    >
  ) {
    try {
      const userId = getUserId();
      if (!userId) return { data: null, error: { message: "Not authenticated" } };

      const { data, error } = await supabase
        .from("budgets")
        .insert({ ...budget, user_id: userId })
        .select("*, category:categories(*)")
        .single();

      if (error) {
        console.error("Add budget error:", error.message);
      } else if (data) {
        setBudgets((prev) => [data as Budget, ...prev]);
      }
      return { data, error };
    } catch (err) {
      console.error("Add budget exception:", err);
      return { data: null, error: { message: String(err) } };
    }
  }

  async function updateBudget(
    id: string,
    updates: Partial<Pick<Budget, "amount" | "period" | "start_date" | "end_date">>
  ) {
    try {
      const { data, error } = await supabase
        .from("budgets")
        .update(updates)
        .eq("id", id)
        .select("*, category:categories(*)")
        .single();

      if (error) {
        console.error("Update budget error:", error.message);
      } else if (data) {
        setBudgets((prev) =>
          prev.map((b) => (b.id === id ? (data as Budget) : b))
        );
      }
      return { data, error };
    } catch (err) {
      console.error("Update budget exception:", err);
      return { data: null, error: { message: String(err) } };
    }
  }

  async function deleteBudget(id: string) {
    try {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) {
        console.error("Delete budget error:", error.message);
      } else {
        setBudgets((prev) => prev.filter((b) => b.id !== id));
      }
      return { error };
    } catch (err) {
      console.error("Delete budget exception:", err);
      return { error: { message: String(err) } };
    }
  }

  return {
    budgets,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    refetch: fetchBudgets,
  };
}
