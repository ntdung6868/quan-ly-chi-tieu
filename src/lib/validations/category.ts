import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Tên danh mục không được để trống")
    .max(30, "Tên danh mục tối đa 30 ký tự"),
  type: z.enum(["income", "expense"], {
    error: "Loại phải là 'income' hoặc 'expense'",
  }),
  icon: z.string().min(1, "Vui lòng chọn icon"),
  color: z.string().min(1, "Vui lòng chọn màu"),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(30).optional(),
  type: z.enum(["income", "expense"]).optional(),
  icon: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  sort_order: z.number().int().nonnegative().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Cần ít nhất một trường để cập nhật" }
);

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
