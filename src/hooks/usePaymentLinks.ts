import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PaymentLink = {
  id: string;
  price: number;
  url: string;
  label: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export function usePaymentLinks() {
  return useQuery({
    queryKey: ["payment-links"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_links").select("*").order("price", { ascending: true });
      if (error) throw error;
      return data as PaymentLink[];
    },
  });
}

// cijena rezervacije skoro nikad nije point float greska (npr. 99.999999) -- ali usporeduj zaokruzeno na centa da budemo sigurni
export function findPaymentLink(links: PaymentLink[], price: number | null | undefined): PaymentLink | null {
  if (price == null) return null;
  return links.find((l) => Math.round(l.price * 100) === Math.round(price * 100)) ?? null;
}

export function useCreatePaymentLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (link: { price: number; url: string; label: string | null }) => {
      const { error } = await supabase.from("payment_links").insert(link);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-links"] }),
  });
}

export function useUpdatePaymentLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, price, url, label }: { id: string; price: number; url: string; label: string | null }) => {
      const { error } = await supabase.from("payment_links").update({ price, url, label }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-links"] }),
  });
}

export function useDeletePaymentLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-links"] }),
  });
}
