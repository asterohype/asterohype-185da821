import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionProduct {
  id: string;
  collection_id: string;
  shopify_product_id: string;
  position: number;
  created_at: string;
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionProducts, setCollectionProducts] = useState<CollectionProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollections = useCallback(async () => {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching collections:', error);
      return;
    }
    
    setCollections(data || []);
  }, []);

  const fetchCollectionProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('collection_products')
      .select('*')
      .order('position');
    
    if (error) {
      console.error('Error fetching collection products:', error);
      return;
    }
    
    setCollectionProducts(data || []);
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([fetchCollections(), fetchCollectionProducts()]);
      setLoading(false);
    }
    loadData();
  }, [fetchCollections, fetchCollectionProducts]);

  const createCollection = useCallback(async (
    name: string,
    description?: string,
    imageUrl?: string
  ) => {
    const slug = name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    const { data, error } = await supabase
      .from('collections')
      .insert({ name, slug, description, image_url: imageUrl })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
    
    await fetchCollections();
    return data;
  }, [fetchCollections]);

  const updateCollection = useCallback(async (
    id: string,
    updates: Partial<Pick<Collection, 'name' | 'description' | 'image_url' | 'is_active'>>
  ) => {
    const updateData: any = { ...updates };
    
    if (updates.name) {
      updateData.slug = updates.name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }
    
    const { error } = await supabase
      .from('collections')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
    
    await fetchCollections();
  }, [fetchCollections]);

  const deleteCollection = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
    
    await fetchCollections();
  }, [fetchCollections]);

  const addProductToCollection = useCallback(async (
    collectionId: string,
    shopifyProductId: string,
    position?: number
  ) => {
    const { error } = await supabase
      .from('collection_products')
      .insert({
        collection_id: collectionId,
        shopify_product_id: shopifyProductId,
        position: position ?? 0
      });
    
    if (error) {
      if (error.code === '23505') return; // Duplicate
      console.error('Error adding product to collection:', error);
      throw error;
    }
    
    await fetchCollectionProducts();
  }, [fetchCollectionProducts]);

  const removeProductFromCollection = useCallback(async (
    collectionId: string,
    shopifyProductId: string
  ) => {
    const { error } = await supabase
      .from('collection_products')
      .delete()
      .eq('collection_id', collectionId)
      .eq('shopify_product_id', shopifyProductId);
    
    if (error) {
      console.error('Error removing product from collection:', error);
      throw error;
    }
    
    await fetchCollectionProducts();
  }, [fetchCollectionProducts]);

  const getProductsForCollection = useCallback((collectionId: string): string[] => {
    return collectionProducts
      .filter(cp => cp.collection_id === collectionId)
      .sort((a, b) => a.position - b.position)
      .map(cp => cp.shopify_product_id);
  }, [collectionProducts]);

  return {
    collections,
    collectionProducts,
    loading,
    createCollection,
    updateCollection,
    deleteCollection,
    addProductToCollection,
    removeProductFromCollection,
    getProductsForCollection,
    refetch: () => Promise.all([fetchCollections(), fetchCollectionProducts()])
  };
}
