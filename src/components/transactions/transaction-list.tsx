"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import { formatCurrency } from "@/lib/constants";
import { SwipeableTransactionCard } from "./swipeable-transaction-card";
import type { Transaction, TransactionGroup } from "@/types";

function formatGroupDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isThisYear = date.getFullYear() === now.getFullYear();
  const dayMonth = format(date, "dd/MM", { locale: vi });

  if (isThisYear) {
    const weekday = format(date, "EEEE", { locale: vi });
    return `${weekday}, ${dayMonth}`;
  }
  return `${dayMonth}/${date.getFullYear()}`;
}

interface TransactionListProps {
  groups: TransactionGroup[];
  onTransactionClick: (transaction: Transaction) => void;
  onTransactionDelete?: (transaction: Transaction) => void;
}

export function TransactionList({
  groups,
  onTransactionClick,
  onTransactionDelete,
}: TransactionListProps) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.date}>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-medium text-muted-foreground">
              {formatGroupDate(group.date)}
            </span>
            <div className="flex gap-3 text-xs font-currency">
              {group.total_income > 0 && (
                <span className="text-green-500">+{formatCurrency(group.total_income)}</span>
              )}
              {group.total_expense > 0 && (
                <span className="text-red-500">-{formatCurrency(group.total_expense)}</span>
              )}
            </div>
          </div>
          <div className="rounded-xl border bg-card divide-y overflow-hidden">
            <AnimatePresence mode="popLayout">
              {group.transactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  layout
                  exit={{
                    height: 0,
                    opacity: 0,
                    marginTop: 0,
                    marginBottom: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                    transition: { duration: 0.2, ease: "easeIn" },
                  }}
                >
                  <SwipeableTransactionCard
                    transaction={tx}
                    onClick={() => onTransactionClick(tx)}
                    onDelete={() => onTransactionDelete?.(tx)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}
