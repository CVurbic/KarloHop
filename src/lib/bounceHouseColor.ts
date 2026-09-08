// Deterministic dot/legend color per product, keyed by slug.
// products.sticker_color is for the marketing ribbon ("NAJVEĆI" etc.) and is only
// set on some products — using it for calendar dots left most dots invisible.
// A fixed palette + stable hash guarantees every product always gets a visible,
// consistent color, regardless of how many products exist or get reordered.
const DOT_PALETTE = [
  "#3b82f6", // blue
  "#14b8a6", // teal
  "#ec4899", // pink
  "#eab308", // amber
  "#dc2626", // red
  "#8b5cf6", // violet
  "#22c55e", // green
  "#f97316", // orange
  "#06b6d4", // cyan
  "#6366f1", // indigo
];

export function colorForSlug(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return DOT_PALETTE[hash % DOT_PALETTE.length];
}
