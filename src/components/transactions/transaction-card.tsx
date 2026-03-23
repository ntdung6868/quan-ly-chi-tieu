"use client";

import { formatCurrency } from "@/lib/constants";
import { IconRenderer } from "@/components/shared/icon-renderer";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";

interface TransactionCardProps {
  transaction: Transaction;
  onClick?: () => void;
}

export function TransactionCard({ transaction, onClick }: TransactionCardProps) {
  const isExpense = transaction.type === "expense";

  return (
    <div
      className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${transaction.category?.color}20` }}
      >
        <IconRenderer
          name={transaction.category?.icon ?? "HelpCircle"}
          className="h-5 w-5"
          style={{ color: transaction.category?.color }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {transaction.category?.name ?? "Không rõ"}
        </p>
        {transaction.note && (
          <p className="text-xs text-muted-foreground truncate">{transaction.note}</p>
        )}
      </div>

      <div className="text-right shrink-0">
        <p
          className={cn(
            "text-sm font-semibold font-currency",
            isExpense ? "text-red-500" : "text-green-500"
          )}
        >
          {isExpense ? "-" : "+"}{formatCurrency(transaction.amount)}
        </p>
        {transaction.wallet && (
          <p className="text-xs text-muted-foreground">{transaction.wallet.name}</p>
        )}
      </div>
    </div>
  );
}
