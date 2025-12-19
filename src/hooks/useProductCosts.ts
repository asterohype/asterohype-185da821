import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductCost {
  id: string;
  shopify_product_id: string;
  product_cost: number;
  shipping_cost: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useProductCosts() {
  const [costs, setCosts] = useState<ProductCost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCosts();
  }, []);

  const fetchCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('product_costs')
        .select('*');
      
      if (error) throw error;
      setCosts(data || []);
    } catch (error) {
      console.error('Error fetching costs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCostForProduct = (shopifyProductId: string): ProductCost | undefined => {
    // Normalize the ID (remove gid:// prefix if present)
    const normalizedId = shopifyProductId.replace('gid://shopify/Product/', '');
    return costs.find(c => 
      c.shopify_product_id === normalizedId || 
      c.shopify_product_id === shopifyProductId
    );
  };

  const saveCost = async (
    shopifyProductId: string, 
    productCost: number, 
    shippingCost: number,
    notes?: string
  ): Promise<void> => {
    // Normalize the ID
    const normalizedId = shopifyProductId.replace('gid://shopify/Product/', '');
    
    const existing = getCostForProduct(normalizedId);
    
    try {
      if (existing) {
        const { error } = await supabase
          .from('product_costs')
          .update({ 
            product_cost: productCost, 
            shipping_cost: shippingCost,
            notes: notes || null
          })
          .eq('id', existing.id);
        
        if (error) throw error;
        
        setCosts(prev => prev.map(c => 
          c.id === existing.id 
            ? { ...c, product_cost: productCost, shipping_cost: shippingCost, notes: notes || null }
            : c
        ));
      } else {
        const { data, error } = await supabase
          .from('product_costs')
          .insert({ 
            shopify_product_id: normalizedId,
            product_cost: productCost,
            shipping_cost: shippingCost,
            notes: notes || null
          })
          .select()
          .single();
        
        if (error) throw error;
        if (data) setCosts(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Error saving cost:', error);
      throw error;
    }
  };

  const calculateProfit = (sellingPrice: number, productCost: ProductCost | undefined): {
    totalCost: number;
    profit: number;
    profitMargin: number;
  } => {
    if (!productCost) {
      return { totalCost: 0, profit: sellingPrice, profitMargin: 100 };
    }
    
    const totalCost = productCost.product_cost + productCost.shipping_cost;
    const profit = sellingPrice - totalCost;
    const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    
    return { totalCost, profit, profitMargin };
  };

  return {
    costs,
    loading,
    getCostForProduct,
    saveCost,
    calculateProfit,
    refetch: fetchCosts
  };
}