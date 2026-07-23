import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";

export type RadnikStop = {
  name: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  napuhanac: string[];
};

export type Leg = { minutes: number };
export type RouteResult = { stops: RadnikStop[]; legs: Leg[]; mapsUrl: string };

// iste boje kao BOUNCERS.color u RevenueView.tsx/BookingCalendar.tsx (500 shade) -> marker = ista boja kao napuhanac svugdje drugdje u appu
const NAPUHANAC_COLORS: Record<string, string> = {
  "Minecraft Party": "#3b82f6",
  "Dino Park": "#14b8a6",
  Jednorog: "#ec4899",
  "Paw Patrol": "#eab308",
  "Super Mario": "#dc2626",
};
const DEFAULT_PIN_COLOR = "#0AA8E0";

// solid teardrop pin, 24x24 viewBox (Material "place" bez rupe) -> boja + broj unutra
const PIN_PATH = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";

// putanja kroz sve stopove redom kakvim su predani (bez optimizacije) -> koristi se i za pojedinacni krug i za "sve lokacije danas"
export function buildMapsUrl(origin: { lat: number; lng: number }, stops: { lat: number; lng: number }[]) {
  const waypoints = stops.map((s) => `${s.lat},${s.lng}`).join("|");
  return (
    `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}` +
    `&destination=${origin.lat},${origin.lng}&waypoints=${waypoints}&travelmode=driving`
  );
}

type Props = {
  origin: { lat: number; lng: number };
  stops: RadnikStop[];
  onRoute: (result: RouteResult) => void;
};

// ponytail: optimize (waypoint order) + render u jednom DirectionsService pozivu,
// client-side JS SDK -> nema CORS/backend potrebe (za razliku od raw REST directions API-ja)
export function RouteMap({ origin, stops, onRoute }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps().then((g) => {
      if (cancelled || !mapRef.current || stops.length === 0) return;

      const map = new g.maps.Map(mapRef.current, {
        center: origin,
        zoom: 12,
        disableDefaultUI: true,
        gestureHandling: "greedy",
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
      });
      const renderer = new g.maps.DirectionsRenderer({ map, suppressMarkers: true });
      const service = new g.maps.DirectionsService();

      service.route(
        {
          origin,
          destination: origin,
          waypoints: stops.map((s) => ({ location: { lat: s.lat, lng: s.lng } })),
          optimizeWaypoints: true,
          travelMode: g.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (cancelled || status !== "OK" || !result) return;
          renderer.setDirections(result);

          const order = result.routes[0].waypoint_order;
          const orderedStops = order.map((i) => stops[i]);
          const legs = result.routes[0].legs.slice(0, stops.length).map((leg) => ({
            minutes: Math.round((leg.duration?.value ?? 0) / 60),
          }));

          onRoute({ stops: orderedStops, legs, mapsUrl: buildMapsUrl(origin, orderedStops) });

          new g.maps.Marker({
            position: origin,
            map,
            title: "Skladište",
            icon: {
              path: g.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: DEFAULT_PIN_COLOR,
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
          orderedStops.forEach((s, i) => {
            const color = NAPUHANAC_COLORS[s.napuhanac[0]] ?? DEFAULT_PIN_COLOR;
            new g.maps.Marker({
              position: { lat: s.lat, lng: s.lng },
              map,
              title: s.name,
              icon: {
                path: PIN_PATH,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: "#1e293b",
                strokeWeight: 1,
                scale: 1.6,
                anchor: new g.maps.Point(12, 22),
                labelOrigin: new g.maps.Point(12, 9),
              },
              label: { text: `${i + 1}`, color: "#ffffff", fontSize: "12px", fontWeight: "700" },
            });
          });
        },
      );
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mapRef} className="w-full h-80 rounded-xl border" />;
}
