"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createWalletSchema,
  updateWalletSchema,
  idSchema,
} from "@/lib/validations/wallet";
import type { Wallet } from "@/types";

type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Chưa đăng nhập");
  return { supabase, user };
}

function extractFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const field = issue.path.map(String).join(".");
    if (!fieldErrors[field]) fieldErrors[field] = [];
    fieldErrors[field].push(issue.message);
  }
  return fieldErrors;
}

export async function addWalletAction(input: unknown): Promise<ActionResult<Wallet>> {
  const parsed = createWalletSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", fieldErrors: extractFieldErrors(parsed.error.issues) };
  }

  let supabase, user;
  try {
    ({ supabase, user } = await getAuthenticatedUser());
  } catch {
    return { success: false, error: "Chưa đăng nhập. Vui lòng đăng nhập lại." };
  }

  const { data, error } = await supabase
    .from("wallets")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Wallet };
}

export async function updateWalletAction(
  id: string,
  input: unknown
): Promise<ActionResult<Wallet>> {
  if (!idSchema.safeParse({ id }).success) {
    return { success: false, error: "ID ví không hợp lệ" };
  }

  const parsed = updateWalletSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", fieldErrors: extractFieldErrors(parsed.error.issues) };
  }

  let supabase;
  try {
    ({ supabase } = await getAuthenticatedUser());
  } catch {
    return { success: false, error: "Chưa đăng nhập. Vui lòng đăng nhập lại." };
  }

  const { data, error } = await supabase
    .from("wallets")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Wallet };
}

export async function deleteWalletAction(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse({ id }).success) {
    return { success: false, error: "ID ví không hợp lệ" };
  }

  let supabase;
  try {
    ({ supabase } = await getAuthenticatedUser());
  } catch {
    return { success: false, error: "Chưa đăng nhập. Vui lòng đăng nhập lại." };
  }

  const { error } = await supabase.from("wallets").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}
