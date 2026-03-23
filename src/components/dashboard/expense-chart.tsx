"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/constants";
import type { Transaction } from "@/types";

interface ExpenseChartProps {
  transactions: Transaction[];
}

export function ExpenseChart({ transactions }: ExpenseChartProps) {
  const data = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "expense");
    const grouped = expenses.reduce<Record<string, { name: string; value: number; color: string }>>(
      (acc, tx) => {
        const catName = tx.category?.name ?? "Khác";
        const catColor = tx.category?.color ?? "#6b7280";
        if (!acc[catName]) {
          acc[catName] = { name: catName, value: 0, color: catColor };
        }
        acc[catName].value += tx.amount;
        return acc;
      },
      {}
    );
    return Object.values(grouped).sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiêu theo danh mục</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Chưa có dữ liệu chi tiêu
          </p>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Chi tiêu theo danh mục</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2 w-full">
            {data.slice(0, 5).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                  <span className="text-muted-foreground ml-2">
                    ({((item.value / total) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
