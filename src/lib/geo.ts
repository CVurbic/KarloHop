// Adrese: autocomplete + koordinate preko Google Places API (New) — točni kućni brojevi
// (OSM/Photon fula ruralne adrese). Reverse (pin -> tekst) ostaje na besplatnom Photonu.

export type LatLng = { lat: number; lng: number };
export type AddressHit = { label: string; placeId: string };

const GKEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
const PLACES = "https://places.googleapis.com/v1";

const PHOTON = "https://photon.komoot.io";
// bias na Hrvatsku (centar zemlje) + lokalna imena
const BIAS = "&lang=default&lat=45.1&lon=16.4";

const fwdCache = new Map<string, AddressHit[]>();
const locCache = new Map<string, LatLng | null>();
const revCache = new Map<string, string | null>();

function toLabel(p: Record<string, string>): string {
  // poštanski broj iz OSM-a je u HR često krivo/nepotpuno tagiran -> izostavljamo ga,
  // dostava ide po ulici + pinu na karti
  const street = [p.street ?? p.name, p.housenumber].filter(Boolean).join(" ");
  const city = p.city ?? p.town ?? p.village ?? p.county;
  return [street, city].filter(Boolean).join(", ") || p.name || "";
}

/** Prijedlozi adresa (Google Places Autocomplete). Baca AbortError ako je zahtjev prekinut. */
export async function searchAddress(query: string, signal?: AbortSignal): Promise<AddressHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const cached = fwdCache.get(q);
  if (cached) return cached;

  // ponytail: bez session tokena -> Places se naplaćuje per-request. Za HopHop volumen
  // (par upita/dan) zanemarivo. Ako Places račun poraste -> provuci sessionToken kroz
  // searchAddress + resolvePlace i regeneriraj ga nakon svakog odabira.
  const res = await fetch(`${PLACES}/places:autocomplete`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": GKEY },
    body: JSON.stringify({ input: q, includedRegionCodes: ["hr"], languageCode: "hr" }),
  });
  const data = await res.json();
  const hits: AddressHit[] = (data.suggestions ?? [])
    .map((s: { placePrediction?: { placeId: string; text?: { text: string } } }) => s.placePrediction)
    .filter((p: { placeId?: string } | undefined): p is { placeId: string; text?: { text: string } } => !!p?.placeId)
    .map((p: { placeId: string; text?: { text: string } }) => ({ label: p.text?.text ?? "", placeId: p.placeId }))
    .filter((h: AddressHit) => h.label);

  fwdCache.set(q, hits);
  return hits;
}

/** Koordinate odabranog prijedloga (Google Place Details). */
export async function resolvePlace(placeId: string): Promise<LatLng | null> {
  if (locCache.has(placeId)) return locCache.get(placeId)!;
  try {
    const res = await fetch(`${PLACES}/places/${placeId}`, {
      headers: { "X-Goog-Api-Key": GKEY, "X-Goog-FieldMask": "location" },
    });
    const data = await res.json();
    const loc: LatLng | null = data.location
      ? { lat: data.location.latitude, lng: data.location.longitude }
      : null;
    locCache.set(placeId, loc);
    return loc;
  } catch {
    return null;
  }
}

// --- Rute preko OSRM demo servera (besplatno, bez ključa) ---
// ponytail: router.project-osrm.org je "no heavy use". Za hophop volumen (par ruta/dan) OK.
// Ako počne rate-limitati -> self-host OSRM ili OpenRouteService (besplatan ključ, 2k/dan).
const OSRM = "https://router.project-osrm.org";

/** Vožnja A -> B: točke rute ([lng,lat]) + trajanje u minutama. */
export async function drivingRoute(
  from: LatLng,
  to: LatLng,
): Promise<{ coordinates: [number, number][]; minutes: number } | null> {
  try {
    const c = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const res = await fetch(`${OSRM}/route/v1/driving/${c}?overview=full&geometries=geojson`);
    const data = await res.json();
    const r = data.routes?.[0];
    return r ? { coordinates: r.geometry.coordinates, minutes: Math.round(r.duration / 60) } : null;
  } catch {
    return null;
  }
}

/**
 * Optimizirani krug skladište -> svi stopovi -> skladište.
 * `order` = indeksi ulaznih stopova u redu obilaska; `legMinutes` = minute do svakog (u tom redu).
 */
export async function optimizedTrip(
  origin: LatLng,
  stops: LatLng[],
): Promise<{ order: number[]; legMinutes: number[]; coordinates: [number, number][] } | null> {
  if (stops.length === 0) return null;
  try {
    const pts = [origin, ...stops].map((p) => `${p.lng},${p.lat}`).join(";");
    const res = await fetch(
      `${OSRM}/trip/v1/driving/${pts}?source=first&roundtrip=true&overview=full&geometries=geojson`,
    );
    const data = await res.json();
    if (data.code !== "Ok" || !data.trips?.[0]) return null;

    // waypoints[i].waypoint_index = pozicija ulazne točke i u optimiziranom redu (ulaz 0 = origin)
    const wp: { waypoint_index: number }[] = data.waypoints;
    const order = stops.map((_, i) => i).sort((a, b) => wp[a + 1].waypoint_index - wp[b + 1].waypoint_index);

    // legs u redu obilaska: origin->1, 1->2, ..., n->origin -> uzmi prvih n (dolazak do svakog stopa)
    const legs = data.trips[0].legs as { duration: number }[];
    const legMinutes = order.map((_, i) => Math.round((legs[i]?.duration ?? 0) / 60));

    return { order, legMinutes, coordinates: data.trips[0].geometry.coordinates };
  } catch {
    return null;
  }
}

/** Adresa iz koordinata (za pin na karti). */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (revCache.has(key)) return revCache.get(key)!;
  try {
    const res = await fetch(`${PHOTON}/reverse?lat=${lat}&lon=${lng}${BIAS}`);
    const data = await res.json();
    const p = data.features?.[0]?.properties;
    const out = p ? toLabel(p) || null : null;
    revCache.set(key, out);
    return out;
  } catch {
    return null;
  }
}
