"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/validations/category";
import { idSchema } from "@/lib/validations/wallet";
import type { Category } from "@/types";

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

export async function addCategoryAction(input: unknown): Promise<ActionResult<Category>> {
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", fieldErrors: extractFieldErrors(parsed.error.issues) };
  }

  let supabase, user;
  try {
    ({ supabase, user } = await getAuthenticatedUser());
  } catch {
    return { success: false, error: "Chưa đăng nhập. Vui lòng đăng nhập lại." };
  }

  // Tìm "Khác" cùng type để đặt sort_order trước nó
  const { data: existing } = await supabase
    .from("categories")
    .select("id, sort_order, name")
    .eq("type", parsed.data.type)
    .order("sort_order", { ascending: true });

  const sameType = existing ?? [];
  const khacCat = sameType.find((c: { name: string }) => c.name === "Khác");
  const newSortOrder = khacCat ? khacCat.sort_order : sameType.length + 1;

  if (khacCat) {
    await supabase
      .from("categories")
      .update({ sort_order: khacCat.sort_order + 1 })
      .eq("id", khacCat.id);
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({ ...parsed.data, user_id: user.id, sort_order: newSortOrder })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Category };
}

export async function updateCategoryAction(
  id: string,
  input: unknown
): Promise<ActionResult<Category>> {
  if (!idSchema.safeParse({ id }).success) {
    return { success: false, error: "ID danh mục không hợp lệ" };
  }

  const parsed = updateCategorySchema.safeParse(input);
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
    .from("categories")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Category };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse({ id }).success) {
    return { success: false, error: "ID danh mục không hợp lệ" };
  }

  let supabase;
  try {
    ({ supabase } = await getAuthenticatedUser());
  } catch {
    return { success: false, error: "Chưa đăng nhập. Vui lòng đăng nhập lại." };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}
