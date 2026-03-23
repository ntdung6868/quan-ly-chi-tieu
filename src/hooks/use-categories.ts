"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, getCachedUserId } from "@/lib/supabase/client";
import type { Category, TransactionType } from "@/types";

export function useCategories(type?: TransactionType) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (type) query = query.eq("type", type);

      const { data, error } = await query;
      if (error) {
        console.error("Fetch categories error:", error.message);
      } else {
        setCategories(data ?? []);
      }
    } catch (err) {
      console.error("Fetch categories exception:", err);
    }
    setLoading(false);
  }, [supabase, type]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  function getUserId(): string | null {
    return getCachedUserId();
  }

  async function addCategory(
    cat: Pick<Category, "name" | "type" | "icon" | "color">
  ) {
    try {
      const userId = getUserId();
      if (!userId) return { data: null, error: { message: "Not authenticated" } };

      const sameType = categories.filter((c) => c.type === cat.type);
      const khacCat = sameType.find((c) => c.name === "Khác");
      const newSortOrder = khacCat ? khacCat.sort_order : sameType.length + 1;

      if (khacCat) {
        const { error: sortErr } = await supabase
          .from("categories")
          .update({ sort_order: khacCat.sort_order + 1 })
          .eq("id", khacCat.id);
        if (sortErr) console.error("Update sort_order error:", sortErr.message);
      }

      const { data, error } = await supabase
        .from("categories")
        .insert({
          ...cat,
          user_id: userId,
          sort_order: newSortOrder,
        })
        .select()
        .single();

      if (error) {
        console.error("Add category error:", error.message);
      } else if (data) {
        setCategories((prev) => {
          const updated = khacCat
            ? prev.map((c) => c.id === khacCat.id ? { ...c, sort_order: c.sort_order + 1 } : c)
            : prev;
          return [...updated, data].sort((a, b) => a.sort_order - b.sort_order);
        });
      }
      return { data, error };
    } catch (err) {
      console.error("Add category exception:", err);
      return { data: null, error: { message: String(err) } };
    }
  }

  async function updateCategory(
    id: string,
    updates: Partial<Pick<Category, "name" | "type" | "icon" | "color" | "sort_order">>
  ) {
    try {
      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Update category error:", error.message);
      } else if (data) {
        setCategories((prev) => prev.map((c) => (c.id === id ? data : c)));
      }
      return { data, error };
    } catch (err) {
      console.error("Update category exception:", err);
      return { data: null, error: { message: String(err) } };
    }
  }

  async function deleteCategory(id: string) {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) {
        console.error("Delete category error:", error.message);
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
      return { error };
    } catch (err) {
      console.error("Delete category exception:", err);
      return { error: { message: String(err) } };
    }
  }

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
