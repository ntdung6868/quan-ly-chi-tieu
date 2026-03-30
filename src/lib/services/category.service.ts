import { createClient } from "@/lib/supabase/client";
import type { Category, TransactionType } from "@/types";

// ─── Read-only service function ─────────────────────────────────
// Mutations đã chuyển sang Server Actions (src/lib/actions/)

export async function fetchCategories(type?: TransactionType): Promise<Category[]> {
  const supabase = createClient();
  let query = supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}
