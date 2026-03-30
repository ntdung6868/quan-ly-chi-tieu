"use client";

import { SwipeableCard } from "@/components/shared/swipeable-card";
import { TransactionCard } from "./transaction-card";
import type { Transaction } from "@/types";

interface SwipeableTransactionCardProps {
  transaction: Transaction;
  onClick?: () => void;
  onDelete?: () => void;
}

export function SwipeableTransactionCard({
  transaction,
  onClick,
  onDelete,
}: SwipeableTransactionCardProps) {
  return (
    <SwipeableCard onDelete={onDelete}>
      <TransactionCard transaction={transaction} onClick={onClick} />
    </SwipeableCard>
  );
}
