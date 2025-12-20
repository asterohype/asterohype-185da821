import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductOffer {
  id: string;
  shopify_product_id: string;
  promo_text: string | null;
  promo_subtext: string | null;
  promo_active: boolean;
  offer_end_date: string | null;
  offer_text: string | null;
  offer_active: boolean;
  discount_percent: number | null;
  original_price: number | null;
  low_stock_threshold: number | null;
  low_stock_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useProductOffer(shopifyProductId: string | undefined) {
  return useQuery({
    queryKey: ["product-offer", shopifyProductId],
    queryFn: async () => {
      if (!shopifyProductId) return null;
      const { data, error } = await supabase
        .from("product_offers")
        .select("*")
        .eq("shopify_product_id", shopifyProductId)
        .maybeSingle();
      if (error) throw error;
      return data as ProductOffer | null;
    },
    enabled: !!shopifyProductId,
  });
}

export function useUpsertOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      offer: Partial<ProductOffer> & { shopify_product_id: string }
    ) => {
      const { data, error } = await supabase
        .from("product_offers")
        .upsert(
          {
            shopify_product_id: offer.shopify_product_id,
            promo_text: offer.promo_text,
            promo_subtext: offer.promo_subtext,
            promo_active: offer.promo_active,
            offer_end_date: offer.offer_end_date,
            offer_text: offer.offer_text,
            offer_active: offer.offer_active,
            discount_percent: offer.discount_percent,
            original_price: offer.original_price,
            low_stock_threshold: offer.low_stock_threshold,
            low_stock_active: offer.low_stock_active,
          },
          { onConflict: "shopify_product_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return data as ProductOffer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["product-offer", data.shopify_product_id],
      });
    },
  });
}
