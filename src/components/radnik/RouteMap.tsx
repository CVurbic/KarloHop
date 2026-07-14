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

      const map = new g.maps.Map(mapRef.current, { center: origin, zoom: 12 });
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

          new g.maps.Marker({ position: origin, map, label: "S", title: "Skladište" });
          orderedStops.forEach((s, i) => {
            new g.maps.Marker({ position: { lat: s.lat, lng: s.lng }, map, label: `${i + 1}`, title: s.name });
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
