import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProductRating(productId: string) {
  return useQuery({
    queryKey: ['product-rating', productId],
    queryFn: async () => {
      // Fetch reviews for this product
      // We assume a 'reviews' table exists. If not, this will fail/return null until created.
      // Ideally we would use an aggregation query, but Supabase JS client doesn't support complex aggregations easily without RPC.
      // For now, fetch all ratings (optimized: select only rating column).
      
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId);

      if (error) {
        // Silently fail if table doesn't exist (PGRST205)
        if (error.code !== 'PGRST205') {
          console.error('Error fetching ratings:', error);
        }
        return { rating: 0, reviewCount: 0 };
      }

      if (!data || data.length === 0) {
        return { rating: 0, reviewCount: 0 };
      }

      const total = data.reduce((acc, curr) => acc + (curr.rating || 0), 0);
      const avg = total / data.length;

      return {
        rating: avg,
        reviewCount: data.length
      };
    },
    // Initial data to avoid flicker/NaN
    initialData: { rating: 0, reviewCount: 0 }
  });
}
