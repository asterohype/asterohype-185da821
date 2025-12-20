import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SizeConversion {
  id: string;
  shopify_product_id: string;
  asian_size: string;
  local_size: string;
  size_type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useSizeConversions = (shopifyProductId: string | undefined) => {
  return useQuery({
    queryKey: ['size-conversions', shopifyProductId],
    queryFn: async () => {
      if (!shopifyProductId) return [];
      const { data, error } = await supabase
        .from('product_size_conversions')
        .select('*')
        .eq('shopify_product_id', shopifyProductId)
        .order('asian_size');
      
      if (error) throw error;
      return data as SizeConversion[];
    },
    enabled: !!shopifyProductId,
  });
};

export const useUpsertSizeConversion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversion: Omit<SizeConversion, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('product_size_conversions')
        .upsert(conversion, { onConflict: 'shopify_product_id,asian_size' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['size-conversions', variables.shopify_product_id] });
    },
  });
};

export const useDeleteSizeConversion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, shopifyProductId }: { id: string; shopifyProductId: string }) => {
      const { error } = await supabase
        .from('product_size_conversions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { shopifyProductId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['size-conversions', data.shopifyProductId] });
    },
  });
};

export const useGenerateSizeConversions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      shopifyProductId, 
      asianSizes, 
      sizeType 
    }: { 
      shopifyProductId: string; 
      asianSizes: string[]; 
      sizeType: string;
    }) => {
      // Asian to EU/ES size conversion mappings
      const clothingMap: Record<string, string> = {
        'XS': 'S', 'S': 'M', 'M': 'L', 'L': 'XL', 'XL': 'XXL', 'XXL': 'XXXL',
        '2XL': 'XXXL', '3XL': '4XL', '4XL': '5XL',
        // Numeric sizes (Asian run ~2 sizes smaller)
        '155/80A': '34 EU', '160/84A': '36 EU', '165/88A': '38 EU', 
        '170/92A': '40 EU', '175/96A': '42 EU', '180/100A': '44 EU',
      };
      
      const shoesMap: Record<string, string> = {
        '35': '36 EU', '36': '37 EU', '37': '38 EU', '38': '39 EU',
        '39': '40 EU', '40': '41 EU', '41': '42 EU', '42': '43 EU',
        '43': '44 EU', '44': '45 EU', '45': '46 EU', '46': '47 EU',
      };
      
      const map = sizeType === 'shoes' ? shoesMap : clothingMap;
      
      const conversions = asianSizes.map(asianSize => {
        const normalizedSize = asianSize.toUpperCase().trim();
        const localSize = map[normalizedSize] || `${normalizedSize} (convertir manualmente)`;
        
        return {
          shopify_product_id: shopifyProductId,
          asian_size: asianSize,
          local_size: localSize,
          size_type: sizeType,
          notes: map[normalizedSize] ? 'Conversión automática' : 'Requiere revisión manual',
        };
      });
      
      const { data, error } = await supabase
        .from('product_size_conversions')
        .upsert(conversions, { onConflict: 'shopify_product_id,asian_size' })
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['size-conversions', variables.shopifyProductId] });
    },
  });
};
