import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductTag {
  id: string;
  name: string;
  slug: string;
  group_name: string;
}

export interface ProductTagAssignment {
  id: string;
  shopify_product_id: string;
  tag_id: string;
}

export function useProductTags() {
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [assignments, setAssignments] = useState<ProductTagAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    const { data, error } = await supabase
      .from('product_tags')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching tags:', error);
      return;
    }
    
    setTags(data || []);
  }, []);

  const fetchAssignments = useCallback(async () => {
    const { data, error } = await supabase
      .from('product_tag_assignments')
      .select('*');
    
    if (error) {
      console.error('Error fetching assignments:', error);
      return;
    }
    
    setAssignments(data || []);
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([fetchTags(), fetchAssignments()]);
      setLoading(false);
    }
    loadData();
  }, [fetchTags, fetchAssignments]);

  const getTagsForProduct = useCallback((shopifyProductId: string): ProductTag[] => {
    const productAssignments = assignments.filter(a => a.shopify_product_id === shopifyProductId);
    return productAssignments
      .map(a => tags.find(t => t.id === a.tag_id))
      .filter((t): t is ProductTag => !!t);
  }, [assignments, tags]);

  const getProductsForTag = useCallback((tagSlug: string): string[] => {
    const tag = tags.find(t => t.slug === tagSlug);
    if (!tag) return [];
    return assignments
      .filter(a => a.tag_id === tag.id)
      .map(a => a.shopify_product_id);
  }, [assignments, tags]);

  const assignTag = useCallback(async (shopifyProductId: string, tagId: string) => {
    const { error } = await supabase
      .from('product_tag_assignments')
      .insert({ shopify_product_id: shopifyProductId, tag_id: tagId });
    
    if (error) {
      if (error.code === '23505') return; // Duplicate, ignore
      console.error('Error assigning tag:', error);
      throw error;
    }
    
    await fetchAssignments();
  }, [fetchAssignments]);

  const removeTag = useCallback(async (shopifyProductId: string, tagId: string) => {
    const { error } = await supabase
      .from('product_tag_assignments')
      .delete()
      .eq('shopify_product_id', shopifyProductId)
      .eq('tag_id', tagId);
    
    if (error) {
      console.error('Error removing tag:', error);
      throw error;
    }
    
    await fetchAssignments();
  }, [fetchAssignments]);

  const createTag = useCallback(async (name: string, groupName: string = 'General') => {
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
    
    const { error } = await supabase
      .from('product_tags')
      .insert({ name, slug, group_name: groupName });
    
    if (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
    
    await fetchTags();
  }, [fetchTags]);

  const getTagsByGroup = useCallback((): Record<string, ProductTag[]> => {
    return tags.reduce((acc, tag) => {
      const group = tag.group_name || 'General';
      if (!acc[group]) acc[group] = [];
      acc[group].push(tag);
      return acc;
    }, {} as Record<string, ProductTag[]>);
  }, [tags]);

  return {
    tags,
    assignments,
    loading,
    getTagsForProduct,
    getProductsForTag,
    getTagsByGroup,
    assignTag,
    removeTag,
    createTag,
    refetch: () => Promise.all([fetchTags(), fetchAssignments()])
  };
}
