import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { prefetchCommonData } from "@/lib/services/server/dashboard.server";
import { WalletsContent } from "@/components/wallets/wallets-content";

export default async function WalletsPage() {
  const queryClient = new QueryClient();
  await prefetchCommonData(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WalletsContent />
    </HydrationBoundary>
  );
}
