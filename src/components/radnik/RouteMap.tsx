import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { optimizedTrip } from "@/lib/geo";
import { colorForSlug } from "@/lib/bounceHouseColor";
import { toBounceHouseSlug } from "@/lib/bounceHouseCompat";
import { useAllBounceHouses } from "@/hooks/useBounceHouseOptions";

export type RadnikStop = {
  name: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  napuhanac: string[];
  // rezervacije na ovoj adresi (merge po adresi moze spojiti vise) -> lookup booking_reports handoffa
  bookingIds?: string[];
  // cijena za naplatu na vratima (gotovina); zbroj svih rezervacija na ovoj adresi
  price?: number | null;
};

export type Leg = { minutes: number };
export type RouteResult = { stops: RadnikStop[]; legs: Leg[]; mapsUrl: string };

const DEFAULT_PIN_COLOR = "#0AA8E0";
const ROUTE_COLOR = "#2563eb";

// putanja kroz sve stopove redom kakvim su predani -> koristi se i za pojedinacni krug i za "sve lokacije danas"
export function buildMapsUrl(origin: { lat: number; lng: number }, stops: { lat: number; lng: number }[]) {
  const waypoints = stops.map((s) => `${s.lat},${s.lng}`).join("|");
  return (
    `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}` +
    `&destination=${origin.lat},${origin.lng}&waypoints=${waypoints}&travelmode=driving`
  );
}

function dotIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:16px;height:16px;border-radius:9999px;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function numPin(color: string, n: number): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<svg width="30" height="40" viewBox="0 0 24 32"><path d="M12 0C6 0 2 4 2 10c0 7 10 22 10 22s10-15 10-22C22 4 18 0 12 0z" fill="${color}" stroke="#1e293b" stroke-width="1"/><text x="12" y="14" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${n}</text></svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
  });
}

type Props = {
  origin: { lat: number; lng: number };
  stops: RadnikStop[];
  onRoute: (result: RouteResult) => void;
};

// Leaflet + OSRM (besplatno, bez ključa): optimizira redoslijed stopova, crta rutu i pinove.
// Ako OSRM zakaže -> onRoute se svejedno zove s neoptimiziranim redom (workflow se ne blokira).
export function RouteMap({ origin, stops, onRoute }: Props) {
  const mapEl = useRef<HTMLDivElement>(null);

  // slug -> spremljena boja napuhanca; ref jer se čita u [] effect closure-u
  const { data: bounceHouses = [] } = useAllBounceHouses();
  const colorBySlug = useRef<Record<string, string>>({});
  colorBySlug.current = Object.fromEntries(bounceHouses.map((b) => [b.slug, b.color]));

  useEffect(() => {
    let cancelled = false;
    if (!mapEl.current || stops.length === 0) return;

    const map = L.map(mapEl.current, { fadeAnimation: false, scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(mapEl.current);

    (async () => {
      const trip = await optimizedTrip(
        origin,
        stops.map((s) => ({ lat: s.lat, lng: s.lng })),
      );
      if (cancelled) return;

      const order = trip?.order ?? stops.map((_, i) => i);
      const orderedStops = order.map((i) => stops[i]);
      const legs: Leg[] = (trip?.legMinutes ?? orderedStops.map(() => 0)).map((minutes) => ({ minutes }));
      onRoute({ stops: orderedStops, legs, mapsUrl: buildMapsUrl(origin, orderedStops) });

      if (trip?.coordinates) {
        L.polyline(
          trip.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
          { color: ROUTE_COLOR, weight: 5, opacity: 0.85 },
        ).addTo(map);
      }

      L.marker([origin.lat, origin.lng], { icon: dotIcon(DEFAULT_PIN_COLOR) }).addTo(map).bindTooltip("Skladište");
      orderedStops.forEach((s, i) => {
        const slug = toBounceHouseSlug(s.napuhanac[0]);
        const color = slug
          ? colorBySlug.current[slug] || colorForSlug(slug)
          : DEFAULT_PIN_COLOR;
        L.marker([s.lat, s.lng], { icon: numPin(color, i + 1) }).addTo(map).bindTooltip(s.name);
      });

      map.fitBounds(
        L.latLngBounds([
          [origin.lat, origin.lng],
          ...orderedStops.map((s) => [s.lat, s.lng] as [number, number]),
        ]),
        { padding: [40, 40] },
      );
    })();

    return () => {
      cancelled = true;
      ro.disconnect();
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mapEl} className="w-full h-80 rounded-xl border z-0" />;
}
