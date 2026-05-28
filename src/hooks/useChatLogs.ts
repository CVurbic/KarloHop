import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ChatLogMessage {
  role: "user" | "assistant" | string;
  content: string;
}

export interface ChatLogBooking {
  name?: string;
  surname?: string;
  phone?: string;
  email?: string | null;
  selected_bounce_house?: string;
  booking_start_date?: string;
  delivery_address?: string;
  [key: string]: unknown;
}

export interface ChatLog {
  id: string;
  conversation_id: string;
  transcript: ChatLogMessage[];
  message_count: number;
  booking: ChatLogBooking | null;
  booking_created: boolean;
  is_test: boolean;
  ip: string | null;
  created_at: string;
  updated_at: string;
}

export function useChatLogs() {
  return useQuery({
    queryKey: ["chat-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mr_hop_chat_logs")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      return (data ?? []) as unknown as ChatLog[];
    },
  });
}
