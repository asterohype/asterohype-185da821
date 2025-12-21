import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductOverride {
  id: string;
  shopify_product_id: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  price: number | null;
  price_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch all overrides (used to apply on product list)
export function useProductOverrides() {
  return useQuery({
    queryKey: ["product-overrides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_overrides")
        .select("*");
      if (error) throw error;
      return (data || []) as ProductOverride[];
    },
    staleTime: 1000 * 60, // 1 min cache
  });
}

// Fetch single override for a product
export function useProductOverride(shopifyProductId: string | undefined) {
  return useQuery({
    queryKey: ["product-override", shopifyProductId],
    queryFn: async () => {
      if (!shopifyProductId) return null;
      const { data, error } = await supabase
        .from("product_overrides")
        .select("*")
        .eq("shopify_product_id", shopifyProductId)
        .maybeSingle();
      if (error) throw error;
      return data as ProductOverride | null;
    },
    enabled: !!shopifyProductId,
  });
}

// Upsert override (insert or update)
export function useUpsertOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      override: Partial<ProductOverride> & { shopify_product_id: string }
    ) => {
      const { data, error } = await supabase
        .from("product_overrides")
        .upsert(
          {
            shopify_product_id: override.shopify_product_id,
            title: override.title,
            subtitle: override.subtitle,
            description: override.description,
            price: override.price,
          },
          { onConflict: "shopify_product_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return data as ProductOverride;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-overrides"] });
      queryClient.invalidateQueries({
        queryKey: ["product-override", data.shopify_product_id],
      });
    },
  });
}

// Delete override (revert to Shopify original)
export function useDeleteOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shopifyProductId: string) => {
      const { error } = await supabase
        .from("product_overrides")
        .delete()
        .eq("shopify_product_id", shopifyProductId);
      if (error) throw error;
    },
    onSuccess: (_, shopifyProductId) => {
      queryClient.invalidateQueries({ queryKey: ["product-overrides"] });
      queryClient.invalidateQueries({
        queryKey: ["product-override", shopifyProductId],
      });
    },
  });
}
