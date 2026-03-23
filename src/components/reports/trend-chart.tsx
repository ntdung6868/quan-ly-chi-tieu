"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, eachDayOfInterval, subDays } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/constants";
import type { Transaction } from "@/types";

interface TrendChartProps {
  transactions: Transaction[];
  days?: number;
  startDate?: Date;
  endDate?: Date;
  title?: string;
}

export function TrendChart({ transactions, days = 30, startDate, endDate, title }: TrendChartProps) {
  const data = useMemo(() => {
    const end = endDate ?? new Date();
    const start = startDate ?? subDays(end, days - 1);
    const interval = eachDayOfInterval({ start, end });

    let cumulativeExpense = 0;

    return interval.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const dayTxs = transactions.filter((t) => t.transaction_date === dateStr);
      const expense = dayTxs
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);

      cumulativeExpense += expense;

      return {
        name: format(date, "dd/MM", { locale: vi }),
        "Chi tiêu ngày": expense,
        "Tổng cộng dồn": cumulativeExpense,
      };
    });
  }, [transactions, days, startDate, endDate]);

  const chartTitle = title ?? `Xu hướng chi tiêu (${days} ngày)`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{chartTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" interval="preserveStartEnd" />
              <YAxis
                className="text-xs"
                tickFormatter={(v) =>
                  v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : `${(v / 1000).toFixed(0)}K`
                }
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
              <Line
                type="monotone"
                dataKey="Chi tiêu ngày"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Tổng cộng dồn"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
