import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Log korištenja predložaka poruka. Migracija: supabase/migrations/20260911_add_message_log.sql
export interface MessageLogRow {
  id: string;
  template_key: string;
  channel: "sms" | "email";
  recipient: string | null;
  body: string;
  context: Record<string, unknown>;
  status: "opened" | "test" | "sent" | "failed";
  created_at: string;
}

export interface MessageLogEntry {
  template_key: string;
  channel?: "sms" | "email";
  recipient?: string | null;
  body: string;
  context?: Record<string, unknown>;
  status?: MessageLogRow["status"];
}

// Zadnjih N zapisa za jedan predložak (kartica u dashboardu). Bez ključa -> cijela lista.
export function useMessageLog(templateKey?: string, limit = 50) {
  return useQuery({
    queryKey: ["message_log", templateKey ?? "all", limit],
    queryFn: async () => {
      let q = supabase
        .from("message_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (templateKey) q = q.eq("template_key", templateKey);
      const { data, error } = await q;
      if (error) throw error;
      return data as MessageLogRow[];
    },
  });
}

export function useLogMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: MessageLogEntry) => {
      // context je jsonb -> Supabase-ov generirani tip trazi Json, ne Record<string, unknown>
      const { error } = await supabase
        .from("message_log")
        .insert({ ...entry, context: entry.context ?? {} } as never);
      if (error) throw error;
    },
    // tiha greska: log nije kriticni put -> ne blokiraj slanje ni ne davi korisnika toastom
    onError: (e) => console.error("message_log insert:", e),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["message_log"] }),
  });
}
