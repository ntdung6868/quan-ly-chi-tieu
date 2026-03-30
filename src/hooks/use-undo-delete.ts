"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";

const UNDO_DELAY_MS = 5000;

interface UseUndoDeleteOptions<T> {
  /** Tên hiển thị trong toast, ví dụ "giao dịch" */
  itemLabel: string;
  /** Hàm thực sự xóa — chỉ gọi sau khi hết thời gian undo */
  onConfirmDelete: (item: T) => Promise<void>;
  /** Ẩn item khỏi UI ngay lập tức */
  onOptimisticHide: (item: T) => void;
  /** Khôi phục item nếu user bấm Undo */
  onRestore: (item: T) => void;
}

/**
 * Hook cho Undo Delete pattern:
 *   1. Ẩn item khỏi UI ngay
 *   2. Hiện toast "Đã xóa" + nút Hoàn tác (5 giây)
 *   3. Hết giờ → gọi server action xóa thật
 *   4. User bấm Hoàn tác → khôi phục item, cancel xóa
 */
export function useUndoDelete<T extends { id: string }>({
  itemLabel,
  onConfirmDelete,
  onOptimisticHide,
  onRestore,
}: UseUndoDeleteOptions<T>) {
  // Map: item.id → timeout ID (để cancel khi undo)
  const pendingDeletes = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const triggerDelete = useCallback(
    (item: T) => {
      // 1. Ẩn ngay khỏi UI
      onOptimisticHide(item);

      // 2. Toast với nút Hoàn tác
      const toastId = toast(`Đã xóa ${itemLabel}`, {
        action: {
          label: "Hoàn tác",
          onClick: () => {
            // Cancel timeout
            const timer = pendingDeletes.current.get(item.id);
            if (timer) {
              clearTimeout(timer);
              pendingDeletes.current.delete(item.id);
            }
            // Khôi phục UI
            onRestore(item);
            toast.dismiss(toastId);
            toast.success(`Đã hoàn tác`);
          },
        },
        duration: UNDO_DELAY_MS,
      });

      // 3. Set timeout — xóa thật sau 5 giây
      const timer = setTimeout(async () => {
        pendingDeletes.current.delete(item.id);
        try {
          await onConfirmDelete(item);
        } catch {
          // Server xóa thất bại → khôi phục UI
          onRestore(item);
          toast.error(`Xóa ${itemLabel} thất bại. Đã khôi phục.`);
        }
      }, UNDO_DELAY_MS);

      pendingDeletes.current.set(item.id, timer);
    },
    [itemLabel, onConfirmDelete, onOptimisticHide, onRestore]
  );

  return { triggerDelete };
}
