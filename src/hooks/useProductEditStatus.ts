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

export interface EditStatusField {
  key: string;
  label: string;
  is_active: boolean;
  is_custom: boolean;
}

export interface CustomStatus {
  id: string;
  shopify_product_id: string;
  field_key: string;
  is_done: boolean;
}

// Fetch available edit status fields
export function useEditStatusFields() {
  return useQuery({
    queryKey: ["edit-status-fields"],
    queryFn: async () => {
      // Return defaults directly to avoid 404 errors if table is missing
      // as per user request to avoid DB usage/errors.
      return [
        { key: 'title_done', label: 'Título', is_active: true, is_custom: false },
        { key: 'price_done', label: 'Precio', is_active: true, is_custom: false },
        { key: 'about_done', label: 'Acerca de', is_active: true, is_custom: false },
        { key: 'description_done', label: 'Descripción', is_active: true, is_custom: false },
        { key: 'model_done', label: 'Modelo', is_active: true, is_custom: false },
        { key: 'color_done', label: 'Color', is_active: true, is_custom: false },
        { key: 'tags_done', label: 'Etiquetas', is_active: true, is_custom: false },
        { key: 'offers_done', label: 'Ofertas', is_active: true, is_custom: false },
        { key: 'images_done', label: 'Imágenes', is_active: true, is_custom: false },
      ] as EditStatusField[];
      
      /* 
      // Original DB Fetch Code (Disabled)
      const { data, error } = await supabase
        .from("edit_status_fields")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) {
        console.warn("Could not fetch edit_status_fields, using defaults", error);
        return [...]
      }
      return data as EditStatusField[];
      */
    },
    staleTime: 1000 * 60,
  });
}

// Add a new edit status field
export function useAddEditStatusField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (field: { key: string, label: string }) => {
      const { data, error } = await supabase
        .from("edit_status_fields")
        .insert({ key: field.key, label: field.label, is_active: true, is_custom: true })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["edit-status-fields"] });
    },
  });
}

// Remove (deactivate) an edit status field
export function useRemoveEditStatusField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      // We don't delete to preserve history, just deactivate
      const { error } = await supabase
        .from("edit_status_fields")
        .update({ is_active: false })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["edit-status-fields"] });
    },
  });
}

// Fetch custom statuses for a product
export function useProductCustomStatuses(shopifyProductId: string | undefined) {
  return useQuery({
    queryKey: ["product-custom-statuses", shopifyProductId],
    queryFn: async () => {
      if (!shopifyProductId) return [];
      // Return empty to avoid 404 if table missing
      return [] as CustomStatus[];
      
      /*
      const { data, error } = await supabase
        .from("product_custom_status")
        .select("*")
        .eq("shopify_product_id", shopifyProductId);
      
      if (error) {
        // Silent fail if table doesn't exist
        return [] as CustomStatus[];
      }
      return data as CustomStatus[];
      */
    },
    enabled: !!shopifyProductId,
  });
}

// Toggle custom status
export function useToggleCustomStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, fieldKey, isDone }: { productId: string, fieldKey: string, isDone: boolean }) => {
      // Upsert
      const { error } = await supabase
        .from("product_custom_status")
        .upsert({ 
          shopify_product_id: productId, 
          field_key: fieldKey, 
          is_done: isDone,
          updated_at: new Date().toISOString()
        }, { onConflict: 'shopify_product_id,field_key' });
      
      if (error) throw error;
      return { productId, fieldKey, isDone };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-custom-statuses", data.productId] });
    },
  });
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
