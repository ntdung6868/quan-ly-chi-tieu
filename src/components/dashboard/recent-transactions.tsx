"use client";

import Link from "next/link";
import { ArrowRight, ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { TransactionCard } from "@/components/transactions/transaction-card";
import { EmptyState } from "@/components/shared/empty-state";
import type { Transaction } from "@/types";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Giao dịch gần đây</CardTitle>
        <Link href="/transactions" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Xem tất cả
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="Chưa có giao dịch"
            description="Hãy thêm giao dịch đầu tiên"
            className="py-6"
          />
        ) : (
          <div className="divide-y">
            {transactions.slice(0, 5).map((tx) => (
              <TransactionCard key={tx.id} transaction={tx} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
