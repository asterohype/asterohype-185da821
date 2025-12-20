import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductReview {
  id: string;
  shopify_product_id: string;
  user_id: string | null;
  user_name: string;
  rating: number;
  title: string | null;
  comment: string | null;
  verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}

export function useProductReviews(shopifyProductId: string | undefined) {
  return useQuery({
    queryKey: ["product-reviews", shopifyProductId],
    queryFn: async () => {
      if (!shopifyProductId) return [];
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("shopify_product_id", shopifyProductId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ProductReview[];
    },
    enabled: !!shopifyProductId,
  });
}

export function useProductReviewStats(shopifyProductId: string | undefined) {
  const { data: reviews = [], isLoading } = useProductReviews(shopifyProductId);
  
  const stats = {
    averageRating: 0,
    totalReviews: reviews.length,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>,
  };

  if (reviews.length > 0) {
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    stats.averageRating = Math.round((total / reviews.length) * 10) / 10;
    reviews.forEach(r => {
      stats.distribution[r.rating] = (stats.distribution[r.rating] || 0) + 1;
    });
  }

  return { stats, isLoading };
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (review: {
      shopify_product_id: string;
      user_name: string;
      rating: number;
      title?: string;
      comment?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Debes iniciar sesión para dejar una reseña");
      
      const { data, error } = await supabase
        .from("product_reviews")
        .insert({
          shopify_product_id: review.shopify_product_id,
          user_id: user.id,
          user_name: review.user_name,
          rating: review.rating,
          title: review.title || null,
          comment: review.comment || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ProductReview;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["product-reviews", data.shopify_product_id] 
      });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, productId, updates }: { 
      reviewId: string; 
      productId: string;
      updates: { rating?: number; title?: string | null; comment?: string | null; user_name?: string };
    }) => {
      const { error } = await supabase
        .from("product_reviews")
        .update(updates)
        .eq("id", reviewId);
      if (error) throw error;
      return productId;
    },
    onSuccess: (productId) => {
      queryClient.invalidateQueries({ 
        queryKey: ["product-reviews", productId] 
      });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, productId }: { reviewId: string; productId: string }) => {
      const { error } = await supabase
        .from("product_reviews")
        .delete()
        .eq("id", reviewId);
      if (error) throw error;
      return productId;
    },
    onSuccess: (productId) => {
      queryClient.invalidateQueries({ 
        queryKey: ["product-reviews", productId] 
      });
    },
  });
}

export function useAdminDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, productId }: { reviewId: string; productId: string }) => {
      // This uses service role via edge function or admin permissions
      const { error } = await supabase
        .from("product_reviews")
        .delete()
        .eq("id", reviewId);
      if (error) throw error;
      return productId;
    },
    onSuccess: (productId) => {
      queryClient.invalidateQueries({ 
        queryKey: ["product-reviews", productId] 
      });
    },
  });
}
