import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  slug: string;
  cover_image: string | null;
  image: string | null;
  gallery: string[];
  short_desc: string | null;
  long_desc: string | null;
  dimensions: string | null;
  capacity: string | null;
  ages: string | null;
  included: string[];
  price: string;
  discount_price: string | null;
  discount_label: string | null;
  sticker_text: string | null;
  sticker_color: string | null;
  /** Identity color for calendar dots / dashboard charts / maps. See lib/bounceHouseColor.ts. */
  color: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_og_image: string | null;
  status: string;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

// Fetch published products (public)
export function usePublishedProducts() {
  return useQuery({
    queryKey: ["products", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products" as string)
        .select("*")
        .eq("status", "published")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Product[];
    },
  });
}

// Fetch single product by slug (public)
export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ["products", "slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products" as string)
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!slug,
  });
}

// Fetch all products (admin)
export function useAllProducts() {
  return useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products" as string)
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Product[];
    },
  });
}

// Fetch single product by ID (admin)
export function useProductById(id: string) {
  return useQuery({
    queryKey: ["products", "id", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products" as string)
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });
}

// Create product
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      product: Omit<Product, "id" | "created_at" | "updated_at">
    ) => {
      const { data, error } = await supabase
        .from("products" as string)
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// Update product
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from("products" as string)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// Reorder products: pass an array of { id, sort_order } and they get persisted in parallel.
export function useReorderProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const now = new Date().toISOString();
      await Promise.all(
        items.map((item) =>
          supabase
            .from("products" as string)
            .update({ sort_order: item.sort_order, updated_at: now })
            .eq("id", item.id)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// Delete product
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products" as string)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
