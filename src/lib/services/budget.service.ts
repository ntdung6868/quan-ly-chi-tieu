import { createClient } from "@/lib/supabase/client";
import type { Budget } from "@/types";

// ─── Read-only service function ─────────────────────────────────
// Mutations đã chuyển sang Server Actions (src/lib/actions/)

export async function fetchBudgets(): Promise<Budget[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("*, category:categories(*)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Budget[];
}
