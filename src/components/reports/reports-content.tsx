"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns";
import { Download } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SummarySkeleton, ChartSkeleton } from "@/components/shared/skeleton-list";
import { CategoryPieChart } from "@/components/reports/pie-chart";
import { MonthlyBarChart } from "@/components/reports/bar-chart";
import { TrendChart } from "@/components/reports/trend-chart";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Transaction } from "@/types";

type DatePreset = "this_month" | "last_month" | "this_year" | "last_3_months";

function getDateRange(preset: DatePreset): { start: string; end: string } {
  const now = new Date();
  switch (preset) {
    case "this_month":
      return { start: format(startOfMonth(now), "yyyy-MM-dd"), end: format(endOfMonth(now), "yyyy-MM-dd") };
    case "last_month": {
      const last = subMonths(now, 1);
      return { start: format(startOfMonth(last), "yyyy-MM-dd"), end: format(endOfMonth(last), "yyyy-MM-dd") };
    }
    case "this_year":
      return { start: format(startOfYear(now), "yyyy-MM-dd"), end: format(endOfYear(now), "yyyy-MM-dd") };
    case "last_3_months": {
      const start = subMonths(startOfMonth(now), 2);
      return { start: format(start, "yyyy-MM-dd"), end: format(endOfMonth(now), "yyyy-MM-dd") };
    }
  }
}

async function fetchReportTransactions(range: { start: string; end: string }): Promise<Transaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, category:categories(*), wallet:wallets(*)")
    .gte("transaction_date", range.start)
    .lte("transaction_date", range.end)
    .order("transaction_date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Transaction[];
}

async function exportExcel(transactions: Transaction[], dateRange: { start: string; end: string }, presetLabel: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Chi Tiêu App";
  const ws = wb.addWorksheet("Giao dịch");

  const titleRow = ws.addRow(["Báo cáo chi tiêu"]);
  ws.mergeCells(titleRow.number, 1, titleRow.number, 6);
  titleRow.getCell(1).font = { bold: true, size: 16 };
  titleRow.getCell(1).alignment = { horizontal: "center" };
  titleRow.height = 30;

  const infoData = [
    ["Kỳ báo cáo:", presetLabel],
    ["Từ ngày:", dateRange.start],
    ["Đến ngày:", dateRange.end],
    ["Ngày xuất:", format(new Date(), "dd/MM/yyyy HH:mm")],
    ["Tổng giao dịch:", `${transactions.length}`],
  ];
  for (const [label, value] of infoData) {
    const row = ws.addRow([label, value]);
    row.getCell(1).font = { bold: true, color: { argb: "FF64748B" } };
    row.getCell(2).font = { color: { argb: "FF1E293B" } };
  }

  ws.addRow([]);

  const headerLabels = ["Ngày", "Loại", "Danh mục", "Số tiền (VND)", "Ví", "Ghi chú"];
  const header = ws.addRow(headerLabels);
  header.height = 28;
  for (let c = 1; c <= 6; c++) {
    const cell = header.getCell(c);
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  }

  const totalIncome = { count: 0, sum: 0 };
  const totalExpense = { count: 0, sum: 0 };

  transactions.forEach((t) => {
    const isIncome = t.type === "income";
    if (isIncome) { totalIncome.count++; totalIncome.sum += t.amount; }
    else { totalExpense.count++; totalExpense.sum += t.amount; }

    const row = ws.addRow([
      t.transaction_date,
      isIncome ? "Thu nhập" : "Chi tiêu",
      t.category?.name ?? "",
      t.amount,
      t.wallet?.name ?? "",
      t.note ?? "",
    ]);

    row.height = 22;

    for (let c = 1; c <= 6; c++) {
      const cell = row.getCell(c);
      cell.alignment = { vertical: "middle" };
      if (row.number % 2 === 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }
    }

    const color = isIncome ? "FF16A34A" : "FFDC2626";
    row.getCell(2).font = { bold: true, color: { argb: color } };
    row.getCell(4).numFmt = "#,##0";
    row.getCell(4).font = { bold: true, color: { argb: color } };
    row.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
  });

  ws.addRow([]);

  const summaryRows = [
    { label: `Thu nhập (${totalIncome.count})`, value: totalIncome.sum, color: "FF16A34A" },
    { label: `Chi tiêu (${totalExpense.count})`, value: totalExpense.sum, color: "FFDC2626" },
    { label: "Số dư", value: totalIncome.sum - totalExpense.sum, color: (totalIncome.sum - totalExpense.sum) >= 0 ? "FF16A34A" : "FFDC2626" },
  ];

  for (const s of summaryRows) {
    const row = ws.addRow([]);
    row.getCell(3).value = s.label;
    row.getCell(3).font = { bold: true };
    row.getCell(4).value = s.value;
    row.getCell(4).numFmt = "#,##0";
    row.getCell(4).font = { bold: true, color: { argb: s.color } };
    row.getCell(4).alignment = { horizontal: "right" };
  }

  ws.columns = [
    { width: 14 }, { width: 12 }, { width: 20 },
    { width: 18 }, { width: 18 }, { width: 35 },
  ];

  const tableHeaderRow = 8;
  const lastDataRow = tableHeaderRow + transactions.length;
  for (let r = tableHeaderRow; r <= lastDataRow; r++) {
    for (let c = 1; c <= 6; c++) {
      ws.getCell(r, c).border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `chi-tieu-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  toast.success("Đã xuất file Excel");
}

export function ReportsContent() {
  const [preset, setPreset] = useState<DatePreset>("this_month");

  const range = getDateRange(preset);
  const yearRange = getDateRange("this_year");

  const { data: transactions = [], isLoading: loadingTxs } = useQuery({
    queryKey: ["reports", preset, range],
    queryFn: () => fetchReportTransactions(range),
  });

  const { data: yearTransactions = [], isLoading: loadingYear } = useQuery({
    queryKey: ["reports", "year", yearRange],
    queryFn: () => fetchReportTransactions(yearRange),
    staleTime: 5 * 60_000,
  });

  const loading = loadingTxs || loadingYear;

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Báo cáo</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={preset} onValueChange={(v) => v && setPreset(v as DatePreset)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue>
                {preset === "this_month" ? "Tháng này" : preset === "last_month" ? "Tháng trước" : preset === "last_3_months" ? "3 tháng gần đây" : "Năm nay"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">Tháng này</SelectItem>
              <SelectItem value="last_month">Tháng trước</SelectItem>
              <SelectItem value="last_3_months">3 tháng gần đây</SelectItem>
              <SelectItem value="this_year">Năm nay</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => {
            const labels: Record<DatePreset, string> = { this_month: "Tháng này", last_month: "Tháng trước", last_3_months: "3 tháng gần đây", this_year: "Năm nay" };
            exportExcel(transactions, range, labels[preset]);
          }}>
            <Download className="h-4 w-4 mr-2" />
            Xuất Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <SummarySkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <ChartSkeleton />
        </div>
      ) : (
        <>
          <SummaryCards
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={totalIncome - totalExpense}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryPieChart transactions={transactions} title="Chi tiêu theo danh mục" type="expense" />
            <CategoryPieChart transactions={transactions} title="Thu nhập theo nguồn" type="income" />
          </div>

          <MonthlyBarChart transactions={yearTransactions} />
          <TrendChart transactions={transactions} days={30} />
        </>
      )}
    </div>
  );
}
