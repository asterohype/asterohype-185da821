import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type RatingValue = 'excelente' | 'muy_bien' | 'bien' | 'mas_o_menos' | 'no_muy_bien';

export interface ProductTestRating {
  id: string;
  shopify_product_id: string;
  tester_code: string;
  rating: RatingValue;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useProductTestRating(shopifyProductId: string | undefined, testerCode: string | null) {
  return useQuery({
    queryKey: ["product-test-rating", shopifyProductId, testerCode],
    queryFn: async () => {
      if (!shopifyProductId || !testerCode) return null;
      const { data, error } = await supabase
        .from("product_test_ratings")
        .select("*")
        .eq("shopify_product_id", shopifyProductId)
        .eq("tester_code", testerCode)
        .maybeSingle();
      if (error) throw error;
      return data as ProductTestRating | null;
    },
    enabled: !!shopifyProductId && !!testerCode,
  });
}

export function useAllProductTestRatings(shopifyProductId: string | undefined) {
  return useQuery({
    queryKey: ["product-test-ratings-all", shopifyProductId],
    queryFn: async () => {
      if (!shopifyProductId) return [];
      const { data, error } = await supabase
        .from("product_test_ratings")
        .select("*")
        .eq("shopify_product_id", shopifyProductId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ProductTestRating[];
    },
    enabled: !!shopifyProductId,
  });
}

export function useUpsertTestRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      shopifyProductId,
      testerCode,
      rating,
      notes,
    }: {
      shopifyProductId: string;
      testerCode: string;
      rating: RatingValue;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("product_test_ratings")
        .upsert(
          {
            shopify_product_id: shopifyProductId,
            tester_code: testerCode,
            rating,
            notes: notes || null,
          },
          { onConflict: "shopify_product_id,tester_code" }
        )
        .select()
        .single();
      if (error) throw error;
      return data as ProductTestRating;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-test-rating", data.shopify_product_id] });
      queryClient.invalidateQueries({ queryKey: ["product-test-ratings-all", data.shopify_product_id] });
    },
  });
}

export function useDeleteTestRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      shopifyProductId,
      testerCode,
    }: {
      shopifyProductId: string;
      testerCode: string;
    }) => {
      const { error } = await supabase
        .from("product_test_ratings")
        .delete()
        .eq("shopify_product_id", shopifyProductId)
        .eq("tester_code", testerCode);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-test-rating", variables.shopifyProductId] });
      queryClient.invalidateQueries({ queryKey: ["product-test-ratings-all", variables.shopifyProductId] });
    },
  });
}

export function useValidateTesterCode() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase
        .from("tester_codes")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
