import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";

type Stop = { name: string; lat: number; lng: number };
type Origin = { lat: number; lng: number };

export function OverviewMap({ origin, stops }: { origin: Origin; stops: Stop[] }) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps().then((g) => {
      if (cancelled || !mapRef.current || stops.length === 0) return;

      const bounds = new g.maps.LatLngBounds();
      bounds.extend(origin);
      stops.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));

      const map = new g.maps.Map(mapRef.current, { center: bounds.getCenter(), zoom: 14 });
      map.fitBounds(bounds, 40);

      new g.maps.Marker({ position: origin, map, label: "S", title: "Skladište" });
      stops.forEach((s, i) => {
        new g.maps.Marker({ position: { lat: s.lat, lng: s.lng }, map, label: `${i + 1}`, title: s.name });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [origin, stops]);

  return <div className="w-full h-56 rounded-xl border" ref={mapRef} />;
}
