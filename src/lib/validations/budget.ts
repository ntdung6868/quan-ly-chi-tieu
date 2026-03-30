import { z } from "zod";

export const createBudgetSchema = z.object({
  category_id: z.string().uuid("Danh mục không hợp lệ"),
  amount: z
    .number({ error: "Hạn mức phải là số" })
    .positive("Hạn mức phải lớn hơn 0"),
  period: z.enum(["weekly", "monthly", "yearly"], {
    error: "Chu kỳ không hợp lệ",
  }),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không đúng định dạng"),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không đúng định dạng"),
});

export const updateBudgetSchema = z.object({
  amount: z.number().positive("Hạn mức phải lớn hơn 0").optional(),
  period: z.enum(["weekly", "monthly", "yearly"]).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Cần ít nhất một trường để cập nhật" }
);

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
