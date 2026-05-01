export interface ParsedReservation {
  name: string;
  email: string;
  phone: string;
  bouncer: string;
  date: string;
  address: string;
  price: string;
}

export function parseReservation(text: string): ParsedReservation {
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

  // Normalize bouncer name to match known names
  if (result.bouncer) {
    const b = result.bouncer.toLowerCase();
    if (b.includes("dino")) {
      result.bouncer = "Dino Park";
    } else if (b.includes("minecraft")) {
      result.bouncer = "Minecraft Party";
    } else if (b.includes("jednorog") || b.includes("unicorn")) {
      result.bouncer = "Jednorog";
    } else if (b.includes("paw") || b.includes("patrol")) {
      result.bouncer = "Paw Patrol";
    }
  }

  return result;
}
