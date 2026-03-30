"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchCategories } from "@/lib/services/category.service";
import {
  addCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/lib/actions/category.actions";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/lib/validations/category";
import { queryKeys, invalidateAfterCategoryDelete } from "@/lib/query-keys";
import type { Category, TransactionType } from "@/types";

export function useCategories(type?: TransactionType) {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.categories.byType(type),
    queryFn: () => fetchCategories(type),
  });

  const addMutation = useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const result = await addCategoryAction(input);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateCategoryInput }) => {
      const result = await updateCategoryAction(id, updates);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteCategoryAction(id);
      if (!result.success) throw new Error(result.error);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all });
      const previous = queryClient.getQueryData<Category[]>(queryKeys.categories.byType(type));
      queryClient.setQueryData(
        queryKeys.categories.byType(type),
        (old: Category[] | undefined) => old?.filter((c) => c.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.categories.byType(type), context.previous);
      }
    },
    onSettled: () => {
      invalidateAfterCategoryDelete(queryClient);
    },
  });

  return {
    categories,
    loading,
    addCategory: async (input: CreateCategoryInput) => {
      try {
        const data = await addMutation.mutateAsync(input);
        return { data, error: null };
      } catch (err) {
        return { data: null, error: { message: err instanceof Error ? err.message : String(err) } };
      }
    },
    updateCategory: async (id: string, updates: UpdateCategoryInput) => {
      try {
        const data = await updateMutation.mutateAsync({ id, updates });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: { message: err instanceof Error ? err.message : String(err) } };
      }
    },
    deleteCategory: async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        return { error: null };
      } catch (err) {
        return { error: { message: err instanceof Error ? err.message : String(err) } };
      }
    },
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  };
}
