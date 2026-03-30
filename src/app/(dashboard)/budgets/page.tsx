import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import {
  fetchProfileServer,
  prefetchBudgets,
} from "@/lib/services/server/dashboard.server";
import { BudgetsContent } from "@/components/budgets/budgets-content";

export default async function BudgetsPage() {
  const queryClient = new QueryClient();

  let profile = null;
  try {
    profile = await fetchProfileServer();
  } catch {
    // Auth not ready — client handles
  }

  const monthStartDay = profile?.month_start_day ?? 1;

  await prefetchBudgets(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BudgetsContent initialMonthStartDay={monthStartDay} />
    </HydrationBoundary>
  );
}
