// Bridges the old hardcoded bounce-house names (baked into existing bookings
// rows before the select/calendar started reading the `products` table) to
// today's canonical products.slug, so both formats resolve correctly while
// old bookings are still around.
//
// Once every booking in the DB has been re-saved (or migrated) to store a
// product slug, delete this file and the two lookups below wherever they're
// imported — nothing else needs to change.
export const LEGACY_BOUNCE_HOUSE_SLUGS: Record<string, string> = {
  "Jednorog": "jednorog-napuhanac",
  "Minecraft Party": "minecraft-napuhanac",
  "Dino Park": "dinosaur-napuhanac",
  "Paw Patrol": "paw-patrol-napuhanac",
  "Super Mario": "super-mario-tobogan-napuhanac",
};

/** Any raw value found in bookings.selected_bounce_house -> today's product slug. */
export function toBounceHouseSlug(value: string | null | undefined): string | null {
  if (!value) return null;
  return LEGACY_BOUNCE_HOUSE_SLUGS[value] ?? value;
}

/** Every raw value a booking could store for a given product slug (the slug itself + any legacy name). */
export function rawValuesForSlug(slug: string): string[] {
  const legacyNames = Object.entries(LEGACY_BOUNCE_HOUSE_SLUGS)
    .filter(([, s]) => s === slug)
    .map(([legacyName]) => legacyName);
  return [slug, ...legacyNames];
}
