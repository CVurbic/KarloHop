import { usePublishedProducts, useAllProducts, type Product } from "./useProducts";
import { colorForSlug } from "@/lib/bounceHouseColor";

export interface BounceHouseOption {
  slug: string;
  name: string;
  price: string;
  discountPrice: string | null;
  /** Stable per-product color for calendar dots/badges (not products.sticker_color — that's the marketing ribbon, only set on some products). */
  color: string;
  /** 'draft' | 'published' | 'hidden' — admin dropdowns hide 'hidden' products from new bookings. */
  status: string;
}

const toOption = (p: Product): BounceHouseOption => ({
  slug: p.slug,
  name: p.name,
  price: p.price,
  discountPrice: p.discount_price,
  color: colorForSlug(p.slug),
  status: p.status,
});

/** Public booking form: only what's actually live on the site. */
export function usePublishedBounceHouses() {
  const { data, ...rest } = usePublishedProducts();
  return { ...rest, data: data?.map(toOption) };
}

/** Admin: every product incl. hidden/draft, so bookings against a since-hidden product still resolve a name/color. */
export function useAllBounceHouses() {
  const { data, ...rest } = useAllProducts();
  return { ...rest, data: data?.map(toOption) };
}
