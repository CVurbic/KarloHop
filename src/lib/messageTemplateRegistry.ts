// Gdje je koji predložak poruke zakvačen u aplikaciji.
//
// message_templates (baza) drži TEKST poruke; ovaj registar drži MJESTO -- koji
// dio koda šalje koji predložak i što je okidač. Dashboard ("Automatske poruke")
// spaja to dvoje: uz svaki predložak piše gdje se koristi. Predložak u bazi bez
// reda ovdje -> "nije povezano u kodu"; red ovdje bez predloška u bazi -> ta
// automatska poruka je slomljena dok se predložak ne doda.
//
// Kad zakvačiš novi predložak negdje u kodu: dodaj mu red ovdje.

export interface TemplatePlacement {
  /** message_templates.key */
  key: string;
  /** Gdje u aplikaciji, ljudski. */
  where: string;
  /** Što pokreće slanje. */
  trigger: string;
  /** Izvorni fajl, radi orijentacije u kodu. */
  file: string;
  channel: "sms" | "email";
  /** Primjeri varijabli za "Pregledaj" -- popuni {min}, {stavke}... */
  sampleVars: Record<string, string>;
}

export const TEMPLATE_PLACEMENTS: TemplatePlacement[] = [
  {
    key: "eta_sms",
    where: "Radnik → kartica ture → SMS ikona na aktivnom stopu",
    trigger:
      "Radnik tapne SMS ikonu kad je procjena dolaska (ETA) dostupna. Otvara SMS aplikaciju s prefillanim brojem i tekstom.",
    file: "src/components/radnik/TripCard.tsx",
    channel: "sms",
    sampleVars: { min: "15", stavke: "napuhancem Paw Patrol" },
  },
  {
    key: "eta_sms_fallback",
    where: "Radnik → kartica ture → SMS ikona na aktivnom stopu",
    trigger:
      "Isto kao eta_sms, ali kad procjena dolaska nije dostupna (nema GPS-a ili rute).",
    file: "src/components/radnik/TripCard.tsx",
    channel: "sms",
    sampleVars: { stavke: "napuhancem Paw Patrol" },
  },
];

export function placementFor(key: string): TemplatePlacement | undefined {
  return TEMPLATE_PLACEMENTS.find((p) => p.key === key);
}

// Mjesta u kodu koja očekuju predložak kojeg (još) nema u bazi.
export function missingTemplateKeys(existingKeys: string[]): string[] {
  const have = new Set(existingKeys);
  return TEMPLATE_PLACEMENTS.filter((p) => !have.has(p.key)).map((p) => p.key);
}
