import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['product-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as ProductTag[];
    }
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['product-tag-assignments'],
    queryFn: async () => {
      // Fetch all assignments using pagination to overcome 1000 row limit
      let allAssignments: ProductTagAssignment[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('product_tag_assignments')
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allAssignments = [...allAssignments, ...data];
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }
      
      return allAssignments as ProductTagAssignment[];
    }
  });

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

  const assignTagMutation = useMutation({
    mutationFn: async ({ shopifyProductId, tagId }: { shopifyProductId: string, tagId: string }) => {
      const { data, error } = await supabase
        .from('product_tag_assignments')
        .insert({ shopify_product_id: shopifyProductId, tag_id: tagId })
        .select()
        .single();
      
      if (error) {
        // Ignore duplicate error, treat as success
        if (error.code === '23505') {
            return null; 
        }
        throw error;
      }
      return data;
    },
    onMutate: async ({ shopifyProductId, tagId }) => {
      await queryClient.cancelQueries({ queryKey: ['product-tag-assignments'] });
      const previousAssignments = queryClient.getQueryData<ProductTagAssignment[]>(['product-tag-assignments']);
      
      const tempId = 'temp-' + Date.now();
      queryClient.setQueryData(['product-tag-assignments'], (old: ProductTagAssignment[] = []) => [
        ...old,
        { id: tempId, shopify_product_id: shopifyProductId, tag_id: tagId }
      ]);
      
      return { previousAssignments };
    },
    onError: (error: any, _, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(['product-tag-assignments'], context.previousAssignments);
      }
      if (error.code === '42501') {
        toast.error('No tienes permisos para asignar etiquetas', {
          description: 'Necesitas ser administrador para realizar esta acción.'
        });
      } else if (error.code !== '23505') {
        toast.error('Error al asignar etiqueta');
        console.error('Error assigning tag:', error);
      } else {
        // If duplicate (23505), just silently success, as we optimistically added it
        console.log('Tag already assigned (duplicate), treating as success');
      }
    },
    onSuccess: (data, variables, context) => {
      // Always invalidate to be sure
      queryClient.invalidateQueries({ queryKey: ['product-tag-assignments'] });
      // Only show success toast if we didn't just hit a duplicate error that we swallowed
      // Actually, for duplicates we can also say success or just nothing.
      // Let's check if we threw. If we are here, mutationFn succeeded OR we swallowed error?
      // Wait, react-query onError swallows? No.
      // If mutationFn throws, we go to onError.
      // We need to NOT throw for 23505 in mutationFn if we want to reach onSuccess.
      toast.success('Etiqueta guardada correctamente');
    }
  });

  const removeTagMutation = useMutation({
    mutationFn: async ({ shopifyProductId, tagId }: { shopifyProductId: string, tagId: string }) => {
      const { error } = await supabase
        .from('product_tag_assignments')
        .delete()
        .eq('shopify_product_id', shopifyProductId)
        .eq('tag_id', tagId);
      
      if (error) throw error;
    },
    onMutate: async ({ shopifyProductId, tagId }) => {
      await queryClient.cancelQueries({ queryKey: ['product-tag-assignments'] });
      const previousAssignments = queryClient.getQueryData<ProductTagAssignment[]>(['product-tag-assignments']);
      
      queryClient.setQueryData(['product-tag-assignments'], (old: ProductTagAssignment[] = []) => 
        old.filter(a => !(a.shopify_product_id === shopifyProductId && a.tag_id === tagId))
      );
      
      return { previousAssignments };
    },
    onError: (error: any, _, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(['product-tag-assignments'], context.previousAssignments);
      }
      if (error.code === '42501') {
        toast.error('No tienes permisos para quitar etiquetas', {
          description: 'Necesitas ser administrador para realizar esta acción.'
        });
      } else {
        toast.error('Error al quitar etiqueta');
        console.error('Error removing tag:', error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-tag-assignments'] });
      toast.success('Etiqueta eliminada');
    }
  });

  const createTagMutation = useMutation({
    mutationFn: async ({ name, groupName }: { name: string, groupName: string }) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const { error } = await supabase
        .from('product_tags')
        .insert({ name, group_name: groupName, slug });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-tags'] });
      toast.success('Etiqueta creada');
    },
    onError: (error) => {
      console.error('Error creating tag:', error);
      toast.error('Error al crear etiqueta');
    }
  });

  const updateTagMutation = useMutation({
    mutationFn: async ({ tagId, name }: { tagId: string, name: string }) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const { error } = await supabase
        .from('product_tags')
        .update({ name, slug })
        .eq('id', tagId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-tags'] });
      toast.success('Etiqueta actualizada');
    },
    onError: (error) => {
      console.error('Error updating tag:', error);
      toast.error('Error al actualizar etiqueta');
    }
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from('product_tags')
        .delete()
        .eq('id', tagId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-tags'] });
      queryClient.invalidateQueries({ queryKey: ['product-tag-assignments'] });
      toast.success('Etiqueta eliminada');
    },
    onError: (error) => {
      console.error('Error deleting tag:', error);
      toast.error('Error al eliminar etiqueta');
    }
  });

  return {
    tags,
    loading: tagsLoading || assignmentsLoading,
    getTagsForProduct,
    getTagsByGroup: useCallback(() => {
      const groups: Record<string, ProductTag[]> = {};
      tags.forEach(tag => {
        const group = tag.group_name || 'Otros';
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(tag);
      });
      return groups;
    }, [tags]),
    assignTag: (shopifyProductId: string, tagId: string) => assignTagMutation.mutateAsync({ shopifyProductId, tagId }),
    removeTag: (shopifyProductId: string, tagId: string) => removeTagMutation.mutateAsync({ shopifyProductId, tagId }),
    createTag: (name: string, groupName: string) => createTagMutation.mutateAsync({ name, groupName }),
    updateTag: (tagId: string, name: string) => updateTagMutation.mutateAsync({ tagId, name }),
    deleteTag: (tagId: string) => deleteTagMutation.mutateAsync(tagId),
    getProductsForTag,
    refetch: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['product-tags'] }),
      queryClient.invalidateQueries({ queryKey: ['product-tag-assignments'] })
    ])
  };
}
