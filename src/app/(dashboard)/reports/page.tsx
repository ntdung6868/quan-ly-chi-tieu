import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { prefetchReport } from "@/lib/services/server/dashboard.server";
import { ReportsContent } from "@/components/reports/reports-content";

export default async function ReportsPage() {
  const queryClient = new QueryClient();

  const now = new Date();
  const range = {
    start: format(startOfMonth(now), "yyyy-MM-dd"),
    end: format(endOfMonth(now), "yyyy-MM-dd"),
  };
  const yearRange = {
    start: format(startOfYear(now), "yyyy-MM-dd"),
    end: format(endOfYear(now), "yyyy-MM-dd"),
  };

  await prefetchReport(queryClient, range, yearRange);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReportsContent />
    </HydrationBoundary>
  );
}
