"use client";

import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export function SummaryCards({ totalIncome, totalExpense, balance }: SummaryCardsProps) {
  const cards = [
    {
      title: "Thu nhập",
      value: totalIncome,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
      prefix: "+",
    },
    {
      title: "Chi tiêu",
      value: totalExpense,
      icon: TrendingDown,
      color: "text-red-500",
      bg: "bg-red-500/10",
      prefix: "-",
    },
    {
      title: "Số dư",
      value: balance,
      icon: Wallet,
      color: balance >= 0 ? "text-blue-500" : "text-red-500",
      bg: balance >= 0 ? "bg-blue-500/10" : "bg-red-500/10",
      prefix: "",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className={cn("text-xl font-bold mt-1 font-currency", card.color)}>
                  {card.prefix}{card.value < 0 ? `-${formatCurrency(Math.abs(card.value))}` : formatCurrency(card.value)}
                </p>
              </div>
              <div className={cn("rounded-full p-2.5", card.bg)}>
                <card.icon className={cn("h-5 w-5", card.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
