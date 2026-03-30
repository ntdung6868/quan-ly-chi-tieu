"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchBudgets } from "@/lib/services/budget.service";
import {
  addBudgetAction,
  updateBudgetAction,
  deleteBudgetAction,
} from "@/lib/actions/budget.actions";
import type { CreateBudgetInput, UpdateBudgetInput } from "@/lib/validations/budget";
import { queryKeys } from "@/lib/query-keys";
import type { Budget } from "@/types";

export function useBudgets() {
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.budgets.all,
    queryFn: fetchBudgets,
  });

  const addMutation = useMutation({
    mutationFn: async (input: CreateBudgetInput) => {
      const result = await addBudgetAction(input);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateBudgetInput }) => {
      const result = await updateBudgetAction(id, updates);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteBudgetAction(id);
      if (!result.success) throw new Error(result.error);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.budgets.all });
      const previous = queryClient.getQueryData<Budget[]>(queryKeys.budgets.all);
      queryClient.setQueryData(
        queryKeys.budgets.all,
        (old: Budget[] | undefined) => old?.filter((b) => b.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.budgets.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
    },
  });

  return {
    budgets,
    loading,
    addBudget: async (input: CreateBudgetInput) => {
      try {
        const data = await addMutation.mutateAsync(input);
        return { data, error: null };
      } catch (err) {
        return { data: null, error: { message: err instanceof Error ? err.message : String(err) } };
      }
    },
    updateBudget: async (id: string, updates: UpdateBudgetInput) => {
      try {
        const data = await updateMutation.mutateAsync({ id, updates });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: { message: err instanceof Error ? err.message : String(err) } };
      }
    },
    deleteBudget: async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        return { error: null };
      } catch (err) {
        return { error: { message: err instanceof Error ? err.message : String(err) } };
      }
    },
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
    },
  };
}
