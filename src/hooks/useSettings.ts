import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSetting(key: string) {
  return useQuery({
    queryKey: ["settings", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", key)
        .single();

      if (error) throw error;
      return (data as { value: string }).value;
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("settings")
        .upsert({ key, value, updated_at: new Date().toISOString() });

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["settings", variables.key] });
    },
  });
}
