import { createClient } from "@/lib/supabase/client";
import type { Wallet } from "@/types";

// ─── Read-only service function ─────────────────────────────────
// Mutations đã chuyển sang Server Actions (src/lib/actions/)

export async function fetchWallets(): Promise<Wallet[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
