import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Booking {
  id: string;
  name: string;
  surname: string;
  email: string | null;
  phone: string | null;
  delivery_address: string | null;
  booking_start_date: string;
  booking_end_date: string | null;
  selected_bounce_house: string | null;
  additional_notes: string | null;
  add_table_set: boolean | null;
  multiple_days: boolean | null;
  status: string;
  price: number | null;
  created_at: string | null;
}

export function useAllBookings() {
  return useQuery({
    queryKey: ["bookings", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings" as string)
        .select("*")
        .order("booking_start_date", { ascending: false });

      if (error) throw error;
      return data as Booking[];
    },
  });
}

export function useUpcomingBookings(limit = 5) {
  const today = new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: ["bookings", "upcoming", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings" as string)
        .select("*")
        .gte("booking_start_date", today)
        .neq("status", "cancelled")
        .order("booking_start_date", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as Booking[];
    },
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      booking: Omit<Booking, "id" | "created_at">
    ) => {
      const { data, error } = await supabase
        .from("bookings" as string)
        .insert(booking)
        .select()
        .single();

      if (error) throw error;
      return data as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Booking> & { id: string }) => {
      const { data, error } = await supabase
        .from("bookings" as string)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bookings" as string)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

// Real-time subscription hook - invalidates queries when bookings change
export function useBookingsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("bookings-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["bookings"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
