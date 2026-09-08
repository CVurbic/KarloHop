import type { BounceHouseOption } from "@/hooks/useBounceHouseOptions";

export interface ParsedReservation {
  name: string;
  email: string;
  phone: string;
  /** Matched product slug (or the raw pasted text if nothing matched). */
  bouncer: string;
  date: string;
  address: string;
  price: string;
}

/** Finds the product whose name shares a significant word with the pasted bouncer text. */
function matchBounceHouse(rawText: string, products: BounceHouseOption[]): BounceHouseOption | undefined {
  const words = rawText.toLowerCase().split(/\s+/).filter((w) => w.length >= 4);
  return products.find((p) => {
    const nameWords = p.name.toLowerCase().split(/\s+/);
    return words.some((w) => nameWords.some((nw) => nw.includes(w) || w.includes(nw)));
  });
}

export function parseReservation(text: string, products: BounceHouseOption[] = []): ParsedReservation {
  const result: ParsedReservation = {
    name: "",
    email: "",
    phone: "",
    bouncer: "",
    date: "",
    address: "",
    price: "",
  };

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (lower.startsWith("ime") || lower.startsWith("prezime") || lower.startsWith("name")) {
      const val = line.split(/[:\-]/)[1]?.trim();
      if (val) result.name = result.name ? `${result.name} ${val}` : val;
    } else if (lower.startsWith("email") || lower.startsWith("e-mail") || lower.startsWith("mail")) {
      const val = line.split(/[:\-]/)[1]?.trim();
      if (val) result.email = val;
    } else if (
      lower.startsWith("telefon") ||
      lower.startsWith("tel") ||
      lower.startsWith("mob") ||
      lower.startsWith("phone")
    ) {
      const val = line.split(/[:\-]/)[1]?.trim();
      if (val) result.phone = val;
    } else if (
      lower.startsWith("napuhanac") ||
      lower.startsWith("model") ||
      lower.startsWith("bouncer") ||
      lower.startsWith("dvorac")
    ) {
      const val = line.split(/[:\-]/)[1]?.trim();
      if (val) result.bouncer = val;
    } else if (
      lower.startsWith("datum") ||
      lower.startsWith("date") ||
      lower.startsWith("termin")
    ) {
      const val = line.split(/[:\-]/).slice(1).join("-").trim();
      if (val) result.date = val;
    } else if (
      lower.startsWith("adresa") ||
      lower.startsWith("lokacija") ||
      lower.startsWith("mjesto") ||
      lower.startsWith("address")
    ) {
      const val = line.split(/[:\-]/)[1]?.trim();
      if (val) result.address = val;
    } else if (
      lower.startsWith("cijena") ||
      lower.startsWith("price") ||
      lower.startsWith("iznos")
    ) {
      const val = line.split(/[:\-]/)[1]?.trim();
      if (val) result.price = val;
    }
  }

  // Resolve the free-typed bouncer text to a real product slug
  if (result.bouncer) {
    const match = matchBounceHouse(result.bouncer, products);
    if (match) result.bouncer = match.slug;
  }

  return result;
}
