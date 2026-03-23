"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, getCachedUserId } from "@/lib/supabase/client";
import { getCached, setCache } from "@/lib/cache";
import type { Wallet } from "@/types";

const CACHE_KEY = "wallets";

export function useWallets() {
  const [wallets, setWallets] = useState<Wallet[]>(() => getCached<Wallet[]>(CACHE_KEY) ?? []);
  const [loading, setLoading] = useState(() => !getCached<Wallet[]>(CACHE_KEY));
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchWallets = useCallback(async () => {
    const cached = getCached<Wallet[]>(CACHE_KEY);
    if (!cached) setLoading(true);

    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Fetch wallets error:", error.message);
      } else {
        setWallets(data ?? []);
        setCache(CACHE_KEY, data ?? []);
      }
    } catch (err) {
      console.error("Fetch wallets exception:", err);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  function getUserId(): string | null {
    return getCachedUserId();
  }

  async function addWallet(
    wallet: Pick<Wallet, "name" | "type" | "icon" | "color" | "balance">
  ) {
    try {
      const userId = getUserId();
      if (!userId) return { data: null, error: { message: "Chưa đăng nhập. Vui lòng đăng nhập lại." } };

      const { data, error } = await supabase
        .from("wallets")
        .insert({ ...wallet, user_id: userId })
        .select()
        .single();

      if (error) {
        console.error("Add wallet error:", error.message);
      } else if (data) {
        setWallets((prev) => [...prev, data]);
      }
      return { data, error };
    } catch (err) {
      console.error("Add wallet exception:", err);
      return { data: null, error: { message: String(err) } };
    }
  }

  async function updateWallet(
    id: string,
    updates: Partial<Pick<Wallet, "name" | "type" | "icon" | "color">>
  ) {
    try {
      const { data, error } = await supabase
        .from("wallets")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Update wallet error:", error.message);
      } else if (data) {
        setWallets((prev) => prev.map((w) => (w.id === id ? data : w)));
      }
      return { data, error };
    } catch (err) {
      console.error("Update wallet exception:", err);
      return { data: null, error: { message: String(err) } };
    }
  }

  async function deleteWallet(id: string) {
    try {
      const { error } = await supabase.from("wallets").delete().eq("id", id);
      if (error) {
        console.error("Delete wallet error:", error.message);
      } else {
        setWallets((prev) => prev.filter((w) => w.id !== id));
      }
      return { error };
    } catch (err) {
      console.error("Delete wallet exception:", err);
      return { error: { message: String(err) } };
    }
  }

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  return {
    wallets,
    totalBalance,
    loading,
    addWallet,
    updateWallet,
    deleteWallet,
    refetch: fetchWallets,
  };
}
