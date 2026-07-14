import { loadGoogleMaps } from "@/lib/googleMaps";

// ponytail: in-memory cache, isti dan bira se vise puta -> ne placa/cekaj Google opet
const cache = new Map<string, { lat: number; lng: number } | null>();

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (cache.has(address)) return cache.get(address)!;

  const g = await loadGoogleMaps();
  const query = address.toLowerCase().includes("hrvatska") ? address : `${address}, Hrvatska`;

  try {
    const { results } = await new g.maps.Geocoder().geocode({ address: query, region: "hr" });
    const loc = results[0]?.geometry.location;
    const coords = loc ? { lat: loc.lat(), lng: loc.lng() } : null;
    cache.set(address, coords);
    return coords;
  } catch {
    cache.set(address, null);
    return null;
  }
}
