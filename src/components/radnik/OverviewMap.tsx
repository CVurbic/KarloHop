import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Stop = { name: string; lat: number; lng: number };
type Origin = { lat: number; lng: number };

const WAREHOUSE_COLOR = "#0AA8E0";

function numIcon(label: string, color = WAREHOUSE_COLOR): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};color:#fff;width:24px;height:24px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font:700 12px system-ui;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)">${label}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export function OverviewMap({ origin, stops }: { origin: Origin; stops: Stop[] }) {
  const mapEl = useRef<HTMLDivElement>(null);
  // stabilan ključ -> ne recreate-aj kartu na svaki render roditelja
  const key = `${origin.lat},${origin.lng}|` + stops.map((s) => `${s.lat},${s.lng}`).join("|");

  useEffect(() => {
    if (!mapEl.current || stops.length === 0) return;

    const map = L.map(mapEl.current, { fadeAnimation: false, scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    L.marker([origin.lat, origin.lng], { icon: numIcon("S") }).addTo(map).bindTooltip("Skladište");
    stops.forEach((s, i) => {
      L.marker([s.lat, s.lng], { icon: numIcon(String(i + 1)) }).addTo(map).bindTooltip(s.name);
    });

    const bounds = L.latLngBounds([
      [origin.lat, origin.lng],
      ...stops.map((s) => [s.lat, s.lng] as [number, number]),
    ]);
    map.fitBounds(bounds, { padding: [40, 40] });

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(mapEl.current);

    return () => {
      ro.disconnect();
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <div className="w-full h-56 rounded-xl border" ref={mapEl} />;
}
