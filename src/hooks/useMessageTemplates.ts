import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MessageTemplate = {
  id: string;
  key: string;
  label: string;
  body: string;
  placeholders: string[];
  created_at: string | null;
  updated_at: string | null;
};

export function useMessageTemplates() {
  return useQuery({
    queryKey: ["message-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as MessageTemplate[];
    },
  });
}

export function useMessageTemplate(key: string) {
  return useQuery({
    queryKey: ["message-templates", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .eq("key", key)
        .maybeSingle();

      if (error) throw error;
      return data as MessageTemplate | null;
    },
  });
}

export function useCreateMessageTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: { key: string; label: string; body: string; placeholders: string[] }) => {
      const { error } = await supabase.from("message_templates").insert(template);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
    },
  });
}

export function useUpdateMessageTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, label, body }: { id: string; label: string; body: string }) => {
      const { error } = await supabase.from("message_templates").update({ label, body }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
    },
  });
}

export function useDeleteMessageTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("message_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
    },
  });
}

export function fillTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}
