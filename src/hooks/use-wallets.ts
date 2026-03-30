"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchWallets } from "@/lib/services/wallet.service";
import {
  addWalletAction,
  updateWalletAction,
  deleteWalletAction,
} from "@/lib/actions/wallet.actions";
import type { CreateWalletInput, UpdateWalletInput } from "@/lib/validations/wallet";
import { queryKeys, invalidateAfterWalletDelete } from "@/lib/query-keys";
import type { Wallet } from "@/types";

export function useWallets() {
  const queryClient = useQueryClient();

  const { data: wallets = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.wallets.all,
    queryFn: fetchWallets,
  });

  const addMutation = useMutation({
    mutationFn: async (input: CreateWalletInput) => {
      const result = await addWalletAction(input);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateWalletInput }) => {
      const result = await updateWalletAction(id, updates);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteWalletAction(id);
      if (!result.success) throw new Error(result.error);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.wallets.all });
      const previous = queryClient.getQueryData<Wallet[]>(queryKeys.wallets.all);
      queryClient.setQueryData(
        queryKeys.wallets.all,
        (old: Wallet[] | undefined) => old?.filter((w) => w.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.wallets.all, context.previous);
      }
    },
    onSettled: () => {
      invalidateAfterWalletDelete(queryClient);
    },
  });

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  return {
    wallets,
    totalBalance,
    loading,
    addWallet: async (input: CreateWalletInput) => {
      try {
        const data = await addMutation.mutateAsync(input);
        return { data, error: null };
      } catch (err) {
        return { data: null, error: { message: err instanceof Error ? err.message : String(err) } };
      }
    },
    updateWallet: async (id: string, updates: UpdateWalletInput) => {
      try {
        const data = await updateMutation.mutateAsync({ id, updates });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: { message: err instanceof Error ? err.message : String(err) } };
      }
    },
    deleteWallet: async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        return { error: null };
      } catch (err) {
        return { error: { message: err instanceof Error ? err.message : String(err) } };
      }
    },
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
    },
  };
}
