import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Dijeljeni zapis po rezervaciji izmedu jutarnje (dostava) i popodnevne (skupljanje) smjene.
// Migracija: supabase/migrations/20260908_add_booking_reports.sql
export interface BookingReport {
  id: string;
  booking_id: string;
  klinovi_count: number | null;
  delivery_note: string | null;
  delivery_photo_paths: string[];
  delivered_at: string | null;
  pickup_condition: "ok" | "damage" | null;
  pickup_note: string | null;
  pickup_photo_paths: string[];
  picked_up_at: string | null;
}

// Reports za rezervacije odabranog dana -> skupljanje cita sto je dostava ostavila (klinovi, napomena).
export function useBookingReports(bookingIds: string[]) {
  const key = [...new Set(bookingIds)].sort().join(",");
  return useQuery({
    queryKey: ["booking_reports", key],
    enabled: bookingIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_reports")
        .select("*")
        .in("booking_id", [...new Set(bookingIds)]);
      if (error) throw error;
      const byBooking: Record<string, BookingReport> = {};
      (data as BookingReport[]).forEach((r) => {
        byBooking[r.booking_id] = r;
      });
      return byBooking;
    },
  });
}

// booking_id je UNIQUE -> upsert umjesto rucnog insert/update grananja; salju se samo polja koja mijenjamo.
export function useUpsertBookingReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<BookingReport> & { booking_id: string }) => {
      const { error } = await supabase
        .from("booking_reports")
        .upsert(patch, { onConflict: "booking_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking_reports"] }),
    onError: (e) => {
      // tiha greska = izgubljen zapis (klinovi/napomena/foto path) -> radnik mora znati
      console.error("booking_reports upsert:", e);
      toast.error("Spremanje na server nije uspjelo — provjeri mrežu.");
    },
  });
}
