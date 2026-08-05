// Late night pickup upsell shared config.
//
// When a customer books an inflatable but does NOT opt into the late night
// pickup add-on, we show an interstitial offering it — using the "at night"
// hero image of the exact inflatable they picked. The football challenge has no
// night image, so it gets no popup (but the add-on still works via the form
// toggle).

// Surcharge added to the booking price when late pickup is selected.
export const LATE_PICKUP_PRICE = 30;

// Maps a booking's `selected_bounce_house` product slug to its night hero image
// in /public/assets. The booking form stores the product slug (see
// usePublishedBounceHouses), not the display name, so this must be keyed by
// slug — including the pre-slug legacy names old bookings may still carry.
// Filenames contain spaces and Croatian characters, so the path is
// URL-encoded before use. Bouncers without an entry (e.g. the football
// challenge) intentionally have no popup.
const NIGHT_IMAGE_BY_BOUNCE_HOUSE: Record<string, string> = {
  "jednorog-napuhanac": "/assets/jednorog noć.png",
  "Jednorog": "/assets/jednorog noć.png",
  "minecraft-napuhanac": "/assets/minecraft noć.png",
  "Minecraft Party": "/assets/minecraft noć.png",
  "dinosaur-napuhanac": "/assets/DINO NOĆ.png",
  "Dino Park": "/assets/DINO NOĆ.png",
  "paw-patrol-napuhanac": "/assets/PAW NOĆ.png",
  "Paw Patrol": "/assets/PAW NOĆ.png",
};

/**
 * Returns the URL-encoded night hero image for a bounce house (by slug or
 * legacy display name), or null when it has none (meaning: show no upsell
 * popup for it).
 */
export function getNightImage(bounceHouse: string | null | undefined): string | null {
  if (!bounceHouse) return null;
  const path = NIGHT_IMAGE_BY_BOUNCE_HOUSE[bounceHouse];
  return path ? encodeURI(path) : null;
}
