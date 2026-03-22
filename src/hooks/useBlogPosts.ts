import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  content: Record<string, unknown>;
  excerpt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Fetch all published posts (public) - includes scheduled posts whose time has passed
export function usePublishedPosts() {
  return useQuery({
    queryKey: ["blog-posts", "published"],
    queryFn: async () => {
      const now = new Date().toISOString();

      // Fetch published posts
      const { data: published, error: err1 } = await supabase
        .from("blog_posts" as string)
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (err1) throw err1;

      // Fetch scheduled posts whose time has come
      const { data: scheduled, error: err2 } = await supabase
        .from("blog_posts" as string)
        .select("*")
        .eq("status", "scheduled")
        .lte("scheduled_at", now);

      if (err2) throw err2;

      // Auto-publish scheduled posts that are due
      const scheduledPosts = (scheduled as BlogPost[]) || [];
      for (const post of scheduledPosts) {
        await supabase
          .from("blog_posts" as string)
          .update({
            status: "published",
            published_at: post.scheduled_at,
            updated_at: new Date().toISOString(),
          })
          .eq("id", post.id);
      }

      const allPosts = [
        ...((published as BlogPost[]) || []),
        ...scheduledPosts.map((p) => ({ ...p, status: "published", published_at: p.scheduled_at })),
      ];

      // Sort by published_at descending
      allPosts.sort((a, b) => {
        const da = a.published_at ? new Date(a.published_at).getTime() : 0;
        const db = b.published_at ? new Date(b.published_at).getTime() : 0;
        return db - da;
      });

      return allPosts;
    },
  });
}

// Fetch single post by slug (public)
export function usePostBySlug(slug: string) {
  return useQuery({
    queryKey: ["blog-posts", "slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts" as string)
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!slug,
  });
}

// Fetch all posts (admin)
export function useAllPosts() {
  return useQuery({
    queryKey: ["blog-posts", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts" as string)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BlogPost[];
    },
  });
}

// Fetch single post by ID (admin)
export function usePostById(id: string) {
  return useQuery({
    queryKey: ["blog-posts", "id", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts" as string)
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!id,
  });
}

// Create post
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      post: Omit<BlogPost, "id" | "created_at" | "updated_at">
    ) => {
      const { data, error } = await supabase
        .from("blog_posts" as string)
        .insert(post)
        .select()
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
}

// Update post
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<BlogPost> & { id: string }) => {
      const { data, error } = await supabase
        .from("blog_posts" as string)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
}

// Delete post
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("blog_posts" as string)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
}
