import { useEffect, useRef, useState } from "react";
import { Navigation, Route as RouteIcon } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { drivingRoute } from "@/lib/geo";
import { colorForSlug } from "@/lib/bounceHouseColor";
import { toBounceHouseSlug } from "@/lib/bounceHouseCompat";
import { useAllBounceHouses } from "@/hooks/useBounceHouseOptions";
import type { RadnikStop } from "./RouteMap";

const WAREHOUSE_COLOR = "#0AA8E0";
const DRIVER_COLOR = "#2563eb";
const ROUTE_COLOR = "#2563eb";
// koliko često smije osvježiti rutu vozač->stop dok vozi (drži OSRM pozive niskima)
const REROUTE_MS = 45000;
// fix lošiji od ovoga (metri) ne koristi se za periodično preusmjeravanje rute
const ACCURACY_GATE_M = 60;
// zoom u navigacijskom modu ("Kreni") — tijesan, ulična razina
const NAV_ZOOM = 17;

function stopColor(stop: RadnikStop, colorBySlug: Record<string, string>): string {
  const slug = toBounceHouseSlug(stop.napuhanac[0]);
  if (!slug) return WAREHOUSE_COLOR;
  return colorBySlug[slug] || colorForSlug(slug);
}

function warehouseIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="background:${WAREHOUSE_COLOR};width:14px;height:14px;border-radius:9999px;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function stopIcon(color: string, n: number, active: boolean): L.DivIcon {
  const scale = active ? 1 : 0.78;
  const w = 30 * scale;
  const h = 40 * scale;
  return L.divIcon({
    className: "",
    html: `<svg width="${w}" height="${h}" viewBox="0 0 24 32" style="opacity:${active ? 1 : 0.5}">
      <path d="M12 0C6 0 2 4 2 10c0 7 10 22 10 22s10-15 10-22C22 4 18 0 12 0z" fill="${color}" stroke="${active ? "#1e293b" : "#94a3b8"}" stroke-width="1"/>
      <text x="12" y="14" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${n}</text>
    </svg>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
  });
}

function driverIcon(heading: number | null, moving: boolean): L.DivIcon {
  const html =
    moving && heading != null
      ? `<svg width="30" height="30" viewBox="-15 -15 30 30" style="transform:rotate(${heading}deg)">
           <path d="M0,-11 8,9 0,4 -8,9 Z" fill="${DRIVER_COLOR}" stroke="#fff" stroke-width="2"/>
         </svg>`
      : `<div style="width:16px;height:16px;border-radius:9999px;background:${DRIVER_COLOR};border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.2)"></div>`;
  return L.divIcon({ className: "", html, iconSize: [30, 30], iconAnchor: [15, 15] });
}

type Props = {
  origin: { lat: number; lng: number }; // skladište — fallback dok nema GPS-a
  stops: RadnikStop[]; // redoslijed kakav vozač vidi
  activeIndex: number;
  onSelectStop?: (index: number) => void; // tap na broj na karti -> skoči na tu dostavu
};

// živa karta u ekranu dostave: ruta OD trenutne pozicije vozača DO aktivnog stopa + pozicija vozača uživo.
// Leaflet + OpenStreetMap + OSRM (besplatno, bez API ključa).
export function LiveTripMap({ origin, stops, activeIndex, onSelectStop }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<L.Map | null>(null);
  const driverMarker = useRef<L.Marker | null>(null);
  const accCircle = useRef<L.Circle | null>(null);
  const routeLine = useRef<L.Polyline | null>(null);
  const stopMarkers = useRef<L.Marker[]>([]);
  const driverPos = useRef<L.LatLngLiteral | null>(null);
  // follow = navigacijski mod ("Kreni"): karta prati vozača i drži tijesan zoom
  const followRef = useRef(false);
  const [follow, setFollow] = useState(false);
  const [hasFix, setHasFix] = useState(false);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);

  const onSelectRef = useRef(onSelectStop);
  useEffect(() => {
    onSelectRef.current = onSelectStop;
  }, [onSelectStop]);

  // slug -> spremljena boja napuhanca; ref jer se koristi u [] effect closure-ima
  const { data: bounceHouses = [] } = useAllBounceHouses();
  const colorBySlug = useRef<Record<string, string>>({});
  colorBySlug.current = Object.fromEntries(bounceHouses.map((b) => [b.slug, b.color]));

  const lastRouteAt = useRef(0);
  const routedIndex = useRef(-1);

  // aktualne vrijednosti za closure-e u [] effect-ima
  const activeIndexRef = useRef(activeIndex);
  const stopsRef = useRef(stops);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
    stopsRef.current = stops;
  }, [activeIndex, stops]);

  useEffect(() => {
    followRef.current = follow;
  }, [follow]);

  const focusStop = (): L.LatLngLiteral | null => {
    const s = stopsRef.current[activeIndexRef.current];
    return s ? { lat: s.lat, lng: s.lng } : null;
  };

  // izračunaj i nacrtaj rutu od `from` do aktivnog stopa
  const routeToActive = async (from: L.LatLngLiteral) => {
    const to = stopsRef.current[activeIndexRef.current];
    if (!to || !mapObj.current) return;
    const r = await drivingRoute(from, { lat: to.lat, lng: to.lng });
    if (!r || !mapObj.current) return;
    const latlngs = r.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
    if (routeLine.current) {
      routeLine.current.setLatLngs(latlngs);
    } else {
      routeLine.current = L.polyline(latlngs, { color: ROUTE_COLOR, weight: 6, opacity: 0.85 }).addTo(mapObj.current);
    }
    lastRouteAt.current = Date.now();
    routedIndex.current = activeIndexRef.current;
  };

  // init karte jednom
  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current, { fadeAnimation: false, zoomControl: false }).setView(
      [origin.lat, origin.lng],
      13,
    );
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    mapObj.current = map;

    // vozač rukom pomakne kartu -> izađi iz navigacije dok ne stisne "Kreni"
    map.on("dragstart", () => setFollow(false));

    L.marker([origin.lat, origin.lng], { icon: warehouseIcon() }).addTo(map).bindTooltip("Skladište");

    stopMarkers.current = stops.map((s, i) => {
      const m = L.marker([s.lat, s.lng], {
        icon: stopIcon(stopColor(s, colorBySlug.current), i + 1, i === activeIndex),
        zIndexOffset: i === activeIndex ? 1000 : 0,
      }).addTo(map);
      m.on("click", () => onSelectRef.current?.(i));
      return m;
    });

    map.fitBounds(
      L.latLngBounds([
        [origin.lat, origin.lng],
        ...stops.map((s) => [s.lat, s.lng] as [number, number]),
      ]),
      { padding: [60, 60] },
    );

    // sheet se digne/spusti -> karta se resize-a, drži fokus centriran dok pratimo
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
      if (followRef.current) {
        const f = driverPos.current ?? focusStop();
        if (f) map.setView(f, map.getZoom());
      }
    });
    ro.observe(mapRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapObj.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // aktivni stop se promijeni (advance ili tap na broj) -> osvježi ikone, rutu i kadar
  useEffect(() => {
    stopMarkers.current.forEach((m, i) => {
      m.setIcon(stopIcon(stopColor(stops[i], colorBySlug.current), i + 1, i === activeIndex));
      m.setZIndexOffset(i === activeIndex ? 1000 : 0);
    });
    if (driverPos.current) routeToActive(driverPos.current);

    const map = mapObj.current;
    if (!map) return;
    if (followRef.current && driverPos.current) {
      map.panTo(driverPos.current);
    } else {
      const f = focusStop();
      const pts: [number, number][] = [];
      if (f) pts.push([f.lat, f.lng]);
      const d = driverPos.current;
      pts.push(d ? [d.lat, d.lng] : [origin.lat, origin.lng]);
      map.fitBounds(L.latLngBounds(pts), { padding: [70, 70] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  // živa GPS pozicija vozača (besplatan browser API, foreground)
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGeoMsg("Uređaj ne podržava lokaciju");
      return;
    }
    // geolokacija radi samo u secure contextu -> http://<lan-ip>:8080 (vite dev) je blokiran, deploy je HTTPS
    if (!window.isSecureContext) {
      setGeoMsg("Lokacija radi samo preko HTTPS-a (ili instaliraj kao aplikaciju)");
      return;
    }

    const onErr = (err: GeolocationPositionError) => {
      if (err.code === err.PERMISSION_DENIED) setGeoMsg("Lokacija nije dozvoljena — uključi je za ovu stranicu");
      else if (err.code === err.POSITION_UNAVAILABLE) setGeoMsg("GPS signal trenutno nedostupan");
      // TIMEOUT: watch nastavlja pokušavati, ne prikazuj grešku
    };

    const onPos = (pos: GeolocationPosition) => {
      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const acc = pos.coords.accuracy; // metri (68% pouzdanost)
      const heading = pos.coords.heading; // stupnjevi od sjevera, null dok miruje / nepodržano
      driverPos.current = p;
      setHasFix(true);
      setGeoMsg(null);

      const map = mapObj.current;
      if (!map) return;

      const moving = heading != null && !Number.isNaN(heading) && (pos.coords.speed ?? 0) > 0.5;
      const icon = driverIcon(heading, moving);
      if (!driverMarker.current) {
        driverMarker.current = L.marker(p, { icon, zIndexOffset: 2000 }).addTo(map);
      } else {
        driverMarker.current.setLatLng(p);
        driverMarker.current.setIcon(icon);
      }

      // krug točnosti -> vozač vidi koliko je fix pouzdan
      if (!accCircle.current) {
        accCircle.current = L.circle(p, {
          radius: acc || 0,
          color: DRIVER_COLOR,
          weight: 1,
          opacity: 0.25,
          fillColor: DRIVER_COLOR,
          fillOpacity: 0.1,
        }).addTo(map);
      } else {
        accCircle.current.setLatLng(p);
        accCircle.current.setRadius(acc || 0);
      }

      if (followRef.current) map.panTo(p);

      // reroute: na promjenu stopa uvijek; periodično samo iz dovoljno točnog fixa
      const stopChanged = routedIndex.current !== activeIndexRef.current;
      const drifted = Date.now() - lastRouteAt.current > REROUTE_MS;
      if (stopChanged || (drifted && (acc || 999) <= ACCURACY_GATE_M)) {
        routeToActive(p);
      }
    };

    // brzi grubi prvi fix (da se točka pojavi odmah), pa precizni watch
    navigator.geolocation.getCurrentPosition(onPos, onErr, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 600000,
    });
    const id = navigator.geolocation.watchPosition(onPos, onErr, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 20000,
    });
    return () => navigator.geolocation.clearWatch(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ekran ne spava dok je karta otvorena
  useEffect(() => {
    // ponytail: wakeLock nije u svim TS lib verzijama -> as any, guard za stare preglednike
    const wl = (navigator as any).wakeLock;
    if (!wl) return;
    let lock: any = null;
    const acquire = () =>
      wl
        .request("screen")
        .then((l: any) => (lock = l))
        .catch(() => {});
    acquire();
    const onVis = () => document.visibilityState === "visible" && acquire();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => {});
    };
  }, []);

  // "Kreni" -> uđi u navigaciju: glatki zoom na vozača (ili aktivni stop dok nema GPS-a) i prati ga
  const startNav = () => {
    setFollow(true);
    const f = driverPos.current ?? focusStop();
    if (f && mapObj.current) mapObj.current.flyTo(f, NAV_ZOOM);
  };

  // "Pregled" -> izađi iz navigacije, glatki zoom out na cijeli put vozač -> aktivni stop
  const stopNav = () => {
    setFollow(false);
    const map = mapObj.current;
    if (!map) return;
    const f = focusStop();
    const pts: [number, number][] = [];
    if (f) pts.push([f.lat, f.lng]);
    const d = driverPos.current;
    pts.push(d ? [d.lat, d.lng] : [origin.lat, origin.lng]);
    map.flyToBounds(L.latLngBounds(pts), { padding: [70, 70] });
  };

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />

      {(geoMsg || !hasFix) && (
        <div className="absolute left-1/2 top-3 z-[1000] max-w-[80%] -translate-x-1/2 rounded-full bg-background/90 px-3 py-1.5 text-center text-xs font-medium text-muted-foreground shadow backdrop-blur">
          {geoMsg ?? "Tražim GPS…"}
        </div>
      )}

      <div className="absolute right-3 top-3 z-[1000]">
        {follow ? (
          <button
            type="button"
            onClick={stopNav}
            className="flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-2 text-xs font-medium text-foreground shadow backdrop-blur transition-transform active:scale-95"
          >
            <RouteIcon className="h-3.5 w-3.5" />
            Pregled
          </button>
        ) : (
          <button
            type="button"
            onClick={startNav}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-transform active:scale-95"
          >
            <Navigation className="h-4 w-4" />
            Kreni
          </button>
        )}
      </div>
    </div>
  );
}
