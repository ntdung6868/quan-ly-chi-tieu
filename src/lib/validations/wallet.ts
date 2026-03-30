import { z } from "zod";

export const createWalletSchema = z.object({
  name: z
    .string()
    .min(1, "Tên ví không được để trống")
    .max(50, "Tên ví tối đa 50 ký tự"),
  type: z.enum(["cash", "bank", "ewallet", "credit"], {
    error: "Loại ví không hợp lệ",
  }),
  icon: z.string().min(1, "Vui lòng chọn icon"),
  color: z.string().min(1, "Vui lòng chọn màu"),
  balance: z.number({ error: "Số dư phải là số" }).default(0),
});

export const updateWalletSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  type: z.enum(["cash", "bank", "ewallet", "credit"]).optional(),
  icon: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Cần ít nhất một trường để cập nhật" }
);

export const idSchema = z.object({
  id: z.string().uuid("ID không hợp lệ"),
});

export type CreateWalletInput = z.infer<typeof createWalletSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;
