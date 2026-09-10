// Single source of truth for a bounce house's identity color — the dot / badge /
// chart color that must look identical everywhere (booking calendar, admin
// dashboard, radnik maps, revenue chart). Stored per product in products.color
// and edited in the admin ProductEditor.
//
// colorForSlug() is only the fallback for a product saved before the color
// column existed (or one that somehow has no color yet).
export const BOUNCE_HOUSE_PALETTE = [
  { name: "Plava", value: "#3b82f6" },
  { name: "Tirkizna", value: "#14b8a6" },
  { name: "Roza", value: "#ec4899" },
  { name: "Žuta", value: "#eab308" },
  { name: "Crvena", value: "#dc2626" },
  { name: "Ljubičasta", value: "#8b5cf6" },
  { name: "Zelena", value: "#22c55e" },
  { name: "Narančasta", value: "#f97316" },
  { name: "Cijan", value: "#06b6d4" },
  { name: "Indigo", value: "#6366f1" },
] as const;

const PALETTE = BOUNCE_HOUSE_PALETTE.map((c) => c.value);

/** Deterministic fallback color for a product with no saved color. */
export function colorForSlug(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/** First palette color not already taken by another product — the default for a new one. */
export function nextFreeColor(usedColors: string[]): string {
  return PALETTE.find((c) => !usedColors.includes(c)) ?? PALETTE[usedColors.length % PALETTE.length];
}
