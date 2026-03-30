"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimationControls,
  type PanInfo,
} from "framer-motion";
import { Trash2 } from "lucide-react";

const DELETE_THRESHOLD = -100;

interface SwipeableCardProps {
  children: React.ReactNode;
  onDelete?: () => void;
  /** Cho phép tắt swipe (ví dụ khi item không được xóa) */
  swipeEnabled?: boolean;
}

/**
 * Generic swipeable wrapper — bọc bất kỳ card nào để có swipe-to-delete.
 * Dùng chung cho TransactionCard, WalletCard, BudgetCard.
 */
export function SwipeableCard({
  children,
  onDelete,
  swipeEnabled = true,
}: SwipeableCardProps) {
  const controls = useAnimationControls();
  const x = useMotionValue(0);
  const isDragging = useRef(false);

  const actionOpacity = useTransform(x, [-120, -40, 0], [1, 0.6, 0]);
  const iconScale = useTransform(x, [-120, -60, 0], [1.2, 0.8, 0.6]);
  const bgOpacity = useTransform(x, [-120, -40, 0], [1, 0.4, 0]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    isDragging.current = false;

    if (info.offset.x < DELETE_THRESHOLD) {
      controls
        .start({
          x: -400,
          opacity: 0,
          transition: { duration: 0.25, ease: "easeIn" },
        })
        .then(() => onDelete?.());
    } else {
      controls.start({
        x: 0,
        transition: { type: "spring", stiffness: 500, damping: 30 },
      });
    }
  }

  if (!swipeEnabled || !onDelete) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Delete action phía sau */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end"
        style={{ opacity: bgOpacity }}
      >
        <div className="flex h-full items-center justify-center bg-red-500 px-6 rounded-r-xl">
          <motion.div style={{ scale: iconScale, opacity: actionOpacity }}>
            <Trash2 className="h-5 w-5 text-white" />
          </motion.div>
        </div>
      </motion.div>

      {/* Card chính — draggable */}
      <motion.div
        style={{ x }}
        animate={controls}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        onDragStart={() => {
          isDragging.current = true;
        }}
        onDragEnd={handleDragEnd}
        className="relative bg-card z-10"
      >
        {children}
      </motion.div>
    </div>
  );
}
