"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createTransactionSchema,
  updateTransactionSchema,
  deleteTransactionSchema,
} from "@/lib/validations/transaction";
import type { Transaction } from "@/types";

// ─── Response type ──────────────────────────────────────────────
// Mọi Server Action trả về cùng shape — client xử lý nhất quán.
type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// ─── Helpers ────────────────────────────────────────────────────
async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  return { supabase, user };
}

// ─── Actions ────────────────────────────────────────────────────

export async function addTransactionAction(
  input: unknown
): Promise<ActionResult<Transaction>> {
  // 1. Validate
  const parsed = createTransactionSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.map(String).join(".");
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return {
      success: false,
      error: "Dữ liệu không hợp lệ",
      fieldErrors,
    };
  }

  // 2. Auth
  let supabase, user;
  try {
    ({ supabase, user } = await getAuthenticatedUser());
  } catch {
    return { success: false, error: "Chưa đăng nhập. Vui lòng đăng nhập lại." };
  }

  // 3. Insert
  const { data, error } = await supabase
    .from("transactions")
    .insert({ ...parsed.data, user_id: user.id })
    .select("*, category:categories(*), wallet:wallets(*)")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as Transaction };
}

export async function updateTransactionAction(
  id: string,
  input: unknown
): Promise<ActionResult<Transaction>> {
  // 1. Validate id
  const idParsed = deleteTransactionSchema.safeParse({ id });
  if (!idParsed.success) {
    return { success: false, error: "ID giao dịch không hợp lệ" };
  }

  // 2. Validate updates
  const parsed = updateTransactionSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.map(String).join(".");
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return { success: false, error: "Dữ liệu không hợp lệ", fieldErrors };
  }

  // 3. Auth
  let supabase;
  try {
    ({ supabase } = await getAuthenticatedUser());
  } catch {
    return { success: false, error: "Chưa đăng nhập. Vui lòng đăng nhập lại." };
  }

  // 4. Update (RLS đảm bảo chỉ update được data của mình)
  const { data, error } = await supabase
    .from("transactions")
    .update(parsed.data)
    .eq("id", id)
    .select("*, category:categories(*), wallet:wallets(*)")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as Transaction };
}

export async function deleteTransactionAction(
  id: string
): Promise<ActionResult> {
  // 1. Validate
  const parsed = deleteTransactionSchema.safeParse({ id });
  if (!parsed.success) {
    return { success: false, error: "ID giao dịch không hợp lệ" };
  }

  // 2. Auth
  let supabase;
  try {
    ({ supabase } = await getAuthenticatedUser());
  } catch {
    return { success: false, error: "Chưa đăng nhập. Vui lòng đăng nhập lại." };
  }

  // 3. Delete (RLS đảm bảo chỉ xóa được data của mình)
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: null };
}
