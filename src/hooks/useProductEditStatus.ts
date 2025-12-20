import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductEditStatus {
  id: string;
  shopify_product_id: string;
  title_done: boolean;
  price_done: boolean;
  description_done: boolean;
  about_done: boolean;
  model_done: boolean;
  color_done: boolean;
  tags_done: boolean;
  offers_done: boolean;
  images_done: boolean;
  all_done: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch all edit statuses
export function useProductEditStatuses() {
  return useQuery({
    queryKey: ["product-edit-statuses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_edit_status")
        .select("*");
      if (error) throw error;
      return (data || []) as ProductEditStatus[];
    },
    staleTime: 1000 * 60,
  });
}

// Fetch single product edit status
export function useProductEditStatus(shopifyProductId: string | undefined) {
  return useQuery({
    queryKey: ["product-edit-status", shopifyProductId],
    queryFn: async () => {
      if (!shopifyProductId) return null;
      const { data, error } = await supabase
        .from("product_edit_status")
        .select("*")
        .eq("shopify_product_id", shopifyProductId)
        .maybeSingle();
      if (error) throw error;
      return data as ProductEditStatus | null;
    },
    enabled: !!shopifyProductId,
  });
}

// Upsert edit status field
export function useUpsertEditStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      update: Partial<ProductEditStatus> & { shopify_product_id: string }
    ) => {
      const { data, error } = await supabase
        .from("product_edit_status")
        .upsert(
          {
            shopify_product_id: update.shopify_product_id,
            title_done: update.title_done,
            price_done: update.price_done,
            description_done: update.description_done,
            about_done: update.about_done,
            model_done: update.model_done,
            color_done: update.color_done,
            tags_done: update.tags_done,
            offers_done: update.offers_done,
            images_done: update.images_done,
          },
          { onConflict: "shopify_product_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return data as ProductEditStatus;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-edit-statuses"] });
      queryClient.invalidateQueries({
        queryKey: ["product-edit-status", data.shopify_product_id],
      });
    },
  });
}

// Toggle single field
export function useToggleEditStatusField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      shopifyProductId,
      field,
      value,
    }: {
      shopifyProductId: string;
      field: keyof Omit<ProductEditStatus, 'id' | 'shopify_product_id' | 'created_at' | 'updated_at' | 'all_done'>;
      value: boolean;
    }) => {
      const { data, error } = await supabase
        .from("product_edit_status")
        .upsert(
          {
            shopify_product_id: shopifyProductId,
            [field]: value,
          },
          { onConflict: "shopify_product_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return data as ProductEditStatus;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-edit-statuses"] });
      queryClient.invalidateQueries({
        queryKey: ["product-edit-status", data.shopify_product_id],
      });
    },
  });
}

// Get incomplete products (for new products panel)
export function useIncompleteProducts() {
  return useQuery({
    queryKey: ["incomplete-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_edit_status")
        .select("*")
        .eq("all_done", false);
      if (error) throw error;
      return (data || []) as ProductEditStatus[];
    },
    staleTime: 1000 * 60,
  });
}
