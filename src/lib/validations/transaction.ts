import { z } from "zod";

export const createTransactionSchema = z.object({
  amount: z
    .number({ error: "Số tiền phải là số" })
    .positive("Số tiền phải lớn hơn 0"),
  type: z.enum(["income", "expense"], {
    error: "Loại phải là 'income' hoặc 'expense'",
  }),
  category_id: z
    .string("Vui lòng chọn danh mục")
    .uuid("Danh mục không hợp lệ"),
  wallet_id: z
    .string("Vui lòng chọn ví")
    .uuid("Ví không hợp lệ"),
  note: z
    .string()
    .max(500, "Ghi chú tối đa 500 ký tự")
    .default(""),
  transaction_date: z
    .string("Vui lòng chọn ngày")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không đúng định dạng YYYY-MM-DD"),
  attachment_url: z.string().url().nullable().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Cần ít nhất một trường để cập nhật" }
);

export const deleteTransactionSchema = z.object({
  id: z.string().uuid("ID giao dịch không hợp lệ"),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
