import { searchAddress, resolvePlace } from "@/lib/geo";

// ponytail: in-memory cache, ista adresa se traži više puta -> ne šalji Google opet
const cache = new Map<string, { lat: number; lng: number } | null>();

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (cache.has(address)) return cache.get(address)!;

  try {
    const hits = await searchAddress(address);
    const coords = hits[0] ? await resolvePlace(hits[0].placeId) : null;
    cache.set(address, coords);
    return coords;
  } catch {
    cache.set(address, null);
    return null;
  }
}
