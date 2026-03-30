import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { format } from "date-fns";
import { getMonthRange } from "@/lib/constants";
import {
  fetchProfileServer,
  prefetchDashboard,
} from "@/lib/services/server/dashboard.server";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const queryClient = new QueryClient();

  let profile = null;
  try {
    profile = await fetchProfileServer();
  } catch {
    // Auth not ready — client handles
  }

  const monthStartDay = profile?.month_start_day ?? 1;
  const now = new Date();
  const monthRange = getMonthRange(now, monthStartDay);
  const startDate = format(monthRange.start, "yyyy-MM-dd");
  const endDate = format(monthRange.end, "yyyy-MM-dd");

  await prefetchDashboard(queryClient, { startDate, endDate });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContent
        initialStartDate={startDate}
        initialEndDate={endDate}
        initialMonthStartDay={monthStartDay}
      />
    </HydrationBoundary>
  );
}
