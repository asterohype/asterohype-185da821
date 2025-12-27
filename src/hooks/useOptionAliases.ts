import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OptionAlias {
  id: string;
  shopify_product_id: string;
  original_name: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export function useOptionAliases() {
  const [aliases, setAliases] = useState<OptionAlias[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAliases();
  }, []);

  const fetchAliases = async () => {
    try {
      const { data, error } = await supabase
        .from('product_option_aliases')
        .select('*');
      
      if (error) throw error;
      setAliases(data || []);
    } catch (error) {
      console.error('Error fetching option aliases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (shopifyProductId: string, originalName: string): string => {
    const normalizedId = shopifyProductId.replace('gid://shopify/Product/', '');
    const alias = aliases.find(a => 
      (a.shopify_product_id === normalizedId || a.shopify_product_id === shopifyProductId) &&
      a.original_name === originalName
    );
    return alias?.display_name || originalName;
  };

  const saveAlias = async (
    shopifyProductId: string,
    originalName: string,
    displayName: string
  ): Promise<void> => {
    const normalizedId = shopifyProductId.replace('gid://shopify/Product/', '');
    
    const existing = aliases.find(a => 
      a.shopify_product_id === normalizedId && 
      a.original_name === originalName
    );
    
    try {
      if (existing) {
        if (displayName === originalName) {
          // If display name matches original, delete the alias
          const { error } = await supabase
            .from('product_option_aliases')
            .delete()
            .eq('id', existing.id);
          
          if (error) throw error;
          setAliases(prev => prev.filter(a => a.id !== existing.id));
        } else {
          // Update existing alias
          const { error } = await supabase
            .from('product_option_aliases')
            .update({ display_name: displayName })
            .eq('id', existing.id);
          
          if (error) throw error;
          setAliases(prev => prev.map(a => 
            a.id === existing.id ? { ...a, display_name: displayName } : a
          ));
        }
      } else if (displayName !== originalName) {
        // Create new alias only if different from original
        const { data, error } = await supabase
          .from('product_option_aliases')
          .insert({
            shopify_product_id: normalizedId,
            original_name: originalName,
            display_name: displayName
          })
          .select()
          .single();
        
        if (error) throw error;
        if (data) setAliases(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Error saving alias:', error);
      throw error;
    }
  };

  return {
    aliases,
    loading,
    getDisplayName,
    saveAlias,
    refetch: fetchAliases
  };
}
