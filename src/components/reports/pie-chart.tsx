"use client";

import { useMemo } from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/constants";
import type { Transaction } from "@/types";

interface CategoryPieChartProps {
  transactions: Transaction[];
  title: string;
  type: "income" | "expense";
}

export function CategoryPieChart({ transactions, title, type }: CategoryPieChartProps) {
  const data = useMemo(() => {
    const filtered = transactions.filter((t) => t.type === type);
    const grouped = filtered.reduce<Record<string, { name: string; value: number; color: string }>>(
      (acc, tx) => {
        const key = tx.category?.name ?? "Khác";
        if (!acc[key]) acc[key] = { name: key, value: 0, color: tx.category?.color ?? "#6b7280" };
        acc[key].value += tx.amount;
        return acc;
      },
      {}
    );
    return Object.values(grouped).sort((a, b) => b.value - a.value);
  }, [transactions, type]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">Chưa có dữ liệu</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                labelLine={false}
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
                  color: "hsl(var(--card-foreground))",
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
