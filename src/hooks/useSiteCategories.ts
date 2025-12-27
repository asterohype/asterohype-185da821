import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SiteCategory {
  id: string;
  slug: string;
  label: string;
  customImage?: string;
}

export function useSiteCategories() {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ["site-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_categories")
        .select("*")
        .order("label");

      if (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }

      return data.map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        label: cat.label,
        customImage: cat.custom_image,
      })) as SiteCategory[];
    },
  });

  const addCategory = useMutation({
    mutationFn: async ({ slug, label }: { slug: string; label: string }) => {
      const { data, error } = await supabase
        .from("site_categories")
        .insert([{ slug, label }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-categories"] });
      toast.success("Categoría creada correctamente");
    },
    onError: (error) => {
      console.error("Error creating category:", error);
      toast.error("Error al crear la categoría");
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string }) => {
      const { error } = await supabase
        .from("site_categories")
        .update({ label })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-categories"] });
      toast.success("Categoría actualizada");
    },
    onError: (error) => {
      console.error("Error updating category:", error);
      toast.error("Error al actualizar la categoría");
    },
  });

  const updateCategoryImage = useMutation({
    mutationFn: async ({ id, imageUrl }: { id: string; imageUrl: string }) => {
      const { error } = await supabase
        .from("site_categories")
        .update({ custom_image: imageUrl })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-categories"] });
      toast.success("Imagen de categoría actualizada");
    },
    onError: (error) => {
      console.error("Error updating category image:", error);
      toast.error("Error al actualizar la imagen");
    },
  });

  const clearCategoryImage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("site_categories")
        .update({ custom_image: null })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-categories"] });
      toast.success("Imagen de categoría eliminada");
    },
    onError: (error) => {
      console.error("Error clearing category image:", error);
      toast.error("Error al eliminar la imagen");
    },
  });

  const removeCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("site_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-categories"] });
      toast.success("Categoría eliminada");
    },
    onError: (error) => {
      console.error("Error deleting category:", error);
      toast.error("Error al eliminar la categoría");
    },
  });

  return {
    categories,
    isLoading,
    error,
    addCategory: addCategory.mutate,
    updateCategory: updateCategory.mutate,
    updateCategoryImage: updateCategoryImage.mutate,
    clearCategoryImage: clearCategoryImage.mutate,
    removeCategory: removeCategory.mutate,
  };
}
