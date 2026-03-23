"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, eachMonthOfInterval, startOfYear, endOfYear } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/constants";
import type { Transaction } from "@/types";

interface MonthlyBarChartProps {
  transactions: Transaction[];
}

export function MonthlyBarChart({ transactions }: MonthlyBarChartProps) {
  const data = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: startOfYear(now),
      end: endOfYear(now),
    });

    return months.map((month) => {
      const monthStr = format(month, "yyyy-MM");
      const monthTxs = transactions.filter((t) =>
        t.transaction_date.startsWith(monthStr)
      );

      const income = monthTxs
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);
      const expense = monthTxs
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);

      return {
        name: format(month, "MMM", { locale: vi }),
        "Thu nhập": income,
        "Chi tiêu": expense,
      };
    });
  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Thu chi theo tháng</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis
                className="text-xs"
                tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
              />
              <Tooltip
                formatter={(value, name) => [formatCurrency(Number(value)), name]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  color: "hsl(var(--card-foreground))",
                }}
              />
              <Legend />
              <Bar dataKey="Thu nhập" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Chi tiêu" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
