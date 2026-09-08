import { useEffect, useRef, useState } from "react";
import { Navigation, Route as RouteIcon } from "lucide-react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import { colorForSlug } from "@/lib/bounceHouseColor";
import { toBounceHouseSlug } from "@/lib/bounceHouseCompat";
import type { RadnikStop } from "./RouteMap";

const WAREHOUSE_COLOR = "#0AA8E0";
const DRIVER_COLOR = "#2563eb";
const ROUTE_COLOR = "#2563eb";
// isti teardrop pin kao RouteMap (Material "place", bez rupe)
const PIN_PATH = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";
// koliko često smije osvježiti rutu vozač->stop dok vozi (drži DirectionsService pozive niskima)
const REROUTE_MS = 45000;
// fix lošiji od ovoga (metri) ne koristi se za periodično preusmjeravanje rute
const ACCURACY_GATE_M = 60;
// strelica smjera vožnje (vrh gore = sjever), rotira se po pos.coords.heading
const ARROW_PATH = "M 0,-9 6,7 0,3 -6,7 Z";
// zoom u navigacijskom modu ("Kreni") — tijesan, ulična razina
const NAV_ZOOM = 17;

// glatki zoom: koraci po jednoj razini, svaki korak Google raster karta sama animira ~200ms
// -> lanac koraka na 130ms djeluje kao kontinuirani zoom, bez vector karte / mapId-a
function glideCamera(map: google.maps.Map, center: google.maps.LatLngLiteral, targetZoom: number) {
  map.panTo(center);
  const target = Math.round(targetZoom);
  const step = () => {
    const z = Math.round(map.getZoom() ?? target);
    if (z === target) return;
    map.setZoom(z + (target > z ? 1 : -1));
    window.setTimeout(step, 130);
  };
  step();
}

// zoom razina koja stane `bounds` u trenutni div (uzima u obzir visinu karte kad je panel podignut)
function zoomForBounds(map: google.maps.Map, bounds: google.maps.LatLngBounds, paddingPx = 70) {
  const latRad = (lat: number) => {
    const s = Math.sin((lat * Math.PI) / 180);
    return Math.log((1 + s) / (1 - s)) / 2;
  };
  const div = map.getDiv() as HTMLElement;
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;
  const lngDiff = ne.lng() - sw.lng();
  const lngFraction = (lngDiff < 0 ? lngDiff + 360 : lngDiff) / 360;
  const w = Math.max(1, div.clientWidth - paddingPx * 2);
  const h = Math.max(1, div.clientHeight - paddingPx * 2);
  const zoom = Math.min(
    Math.log2(h / 256 / (latFraction || 1e-9)),
    Math.log2(w / 256 / (lngFraction || 1e-9)),
  );
  return Math.max(3, Math.min(17, Math.floor(zoom)));
}

function pinIcon(g: typeof google, stop: RadnikStop, active: boolean): google.maps.Symbol {
  const slug = toBounceHouseSlug(stop.napuhanac[0]);
  const color = slug ? colorForSlug(slug) : WAREHOUSE_COLOR;
  return {
    path: PIN_PATH,
    fillColor: color,
    fillOpacity: active ? 1 : 0.4,
    strokeColor: active ? "#1e293b" : "#94a3b8",
    strokeWeight: active ? 2 : 1,
    scale: active ? 2 : 1.3,
    anchor: new g.maps.Point(12, 22),
    labelOrigin: new g.maps.Point(12, 9),
  };
}

type Props = {
  origin: { lat: number; lng: number }; // skladište — fallback dok nema GPS-a
  stops: RadnikStop[]; // redoslijed kakav vozač vidi
  activeIndex: number;
  onSelectStop?: (index: number) => void; // tap na broj na karti -> skoči na tu dostavu
};

// živa karta u ekranu dostave: ruta OD trenutne pozicije vozača DO aktivnog stopa + pozicija vozača uživo
export function LiveTripMap({ origin, stops, activeIndex, onSelectStop }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<google.maps.Map | null>(null);
  const driverMarker = useRef<google.maps.Marker | null>(null);
  const accCircle = useRef<google.maps.Circle | null>(null);
  const stopMarkers = useRef<google.maps.Marker[]>([]);
  const driverPos = useRef<google.maps.LatLngLiteral | null>(null);
  // follow = navigacijski mod ("Kreni"): karta prati vozača i drži tijesan zoom
  const followRef = useRef(false);
  const [follow, setFollow] = useState(false);
  const [hasFix, setHasFix] = useState(false);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);

  const onSelectRef = useRef(onSelectStop);
  useEffect(() => {
    onSelectRef.current = onSelectStop;
  }, [onSelectStop]);

  const dirService = useRef<google.maps.DirectionsService | null>(null);
  const dirRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
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

  const focusStop = () => {
    const s = stopsRef.current[activeIndexRef.current];
    return s ? { lat: s.lat, lng: s.lng } : null;
  };

  // izračunaj i nacrtaj rutu od `from` do aktivnog stopa
  const routeToActive = (g: typeof google, from: google.maps.LatLngLiteral) => {
    const to = stopsRef.current[activeIndexRef.current];
    if (!to || !mapObj.current) return;
    dirService.current ??= new g.maps.DirectionsService();
    dirService.current.route(
      {
        origin: from,
        destination: { lat: to.lat, lng: to.lng },
        travelMode: g.maps.TravelMode.DRIVING,
      },
      (res, status) => {
        if (status !== "OK" || !res || !mapObj.current) return;
        if (!dirRenderer.current) {
          dirRenderer.current = new g.maps.DirectionsRenderer({
            map: mapObj.current,
            suppressMarkers: true,
            preserveViewport: true,
            polylineOptions: { strokeColor: ROUTE_COLOR, strokeWeight: 6, strokeOpacity: 0.85 },
          });
        }
        dirRenderer.current.setDirections(res);
        lastRouteAt.current = Date.now();
        routedIndex.current = activeIndexRef.current;
      },
    );
  };

  // init karte jednom
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then((g) => {
      if (cancelled || !mapRef.current) return;

      const map = new g.maps.Map(mapRef.current, {
        center: origin,
        zoom: 13,
        disableDefaultUI: true,
        gestureHandling: "greedy",
        clickableIcons: false,
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
      });
      mapObj.current = map;

      // vozač rukom pomakne kartu -> izađi iz navigacije dok ne stisne "Kreni"
      map.addListener("dragstart", () => setFollow(false));

      new g.maps.Marker({
        position: origin,
        map,
        title: "Skladište",
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: WAREHOUSE_COLOR,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      stopMarkers.current = stops.map((s, i) => {
        const marker = new g.maps.Marker({
          position: { lat: s.lat, lng: s.lng },
          map,
          title: s.name,
          icon: pinIcon(g, s, i === activeIndex),
          zIndex: i === activeIndex ? 999 : i,
          label: { text: `${i + 1}`, color: "#ffffff", fontSize: "12px", fontWeight: "700" },
        });
        marker.addListener("click", () => onSelectRef.current?.(i));
        return marker;
      });

      const bounds = new g.maps.LatLngBounds();
      bounds.extend(origin);
      stops.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
      map.fitBounds(bounds, 60);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sheet se digne/spusti -> karta se resize-a, drži fokus centriran dok pratimo
  useEffect(() => {
    if (!mapRef.current || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (!followRef.current || !mapObj.current) return;
      const f = driverPos.current ?? focusStop();
      if (f) mapObj.current.setCenter(f);
    });
    ro.observe(mapRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // aktivni stop se promijeni (advance ili tap na broj) -> osvježi ikone, rutu i kadar
  useEffect(() => {
    loadGoogleMaps().then((g) => {
      stopMarkers.current.forEach((m, i) => {
        m.setIcon(pinIcon(g, stops[i], i === activeIndex));
        m.setZIndex(i === activeIndex ? 999 : i);
      });
      if (driverPos.current) routeToActive(g, driverPos.current);

      if (followRef.current && driverPos.current) {
        mapObj.current?.panTo(driverPos.current);
      } else {
        const b = new g.maps.LatLngBounds();
        const f = focusStop();
        if (f) b.extend(f);
        b.extend(driverPos.current ?? origin);
        mapObj.current?.fitBounds(b, 70);
      }
    });
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

      loadGoogleMaps().then((g) => {
          if (!mapObj.current) return;

          // strelica kad znamo smjer vožnje, inače puna točka
          const moving = heading != null && !Number.isNaN(heading) && (pos.coords.speed ?? 0) > 0.5;
          const icon: google.maps.Symbol = moving
            ? {
                path: ARROW_PATH,
                rotation: heading as number,
                scale: 1.7,
                fillColor: DRIVER_COLOR,
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
                anchor: new g.maps.Point(0, 0),
              }
            : {
                path: g.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: DRIVER_COLOR,
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3,
              };

          if (!driverMarker.current) {
            driverMarker.current = new g.maps.Marker({ position: p, map: mapObj.current, zIndex: 1000, icon });
          } else {
            driverMarker.current.setPosition(p);
            driverMarker.current.setIcon(icon);
          }

          // krug točnosti -> vozač vidi koliko je fix pouzdan
          if (!accCircle.current) {
            accCircle.current = new g.maps.Circle({
              map: mapObj.current,
              clickable: false,
              zIndex: 999,
              fillColor: DRIVER_COLOR,
              fillOpacity: 0.1,
              strokeColor: DRIVER_COLOR,
              strokeOpacity: 0.25,
              strokeWeight: 1,
            });
          }
          accCircle.current.setCenter(p);
          accCircle.current.setRadius(acc || 0);

          if (followRef.current) mapObj.current.panTo(p);

          // reroute: na promjenu stopa uvijek; periodično samo iz dovoljno točnog fixa
          const stopChanged = routedIndex.current !== activeIndexRef.current;
          const drifted = Date.now() - lastRouteAt.current > REROUTE_MS;
          if (stopChanged || (drifted && (acc || 999) <= ACCURACY_GATE_M)) {
            routeToActive(g, p);
          }
        });
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
    const acquire = () => wl.request("screen").then((l: any) => (lock = l)).catch(() => {});
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
    if (f && mapObj.current) glideCamera(mapObj.current, f, NAV_ZOOM);
  };

  // "Pregled" -> izađi iz navigacije, glatki zoom out na cijeli put vozač -> aktivni stop
  const stopNav = () => {
    setFollow(false);
    loadGoogleMaps().then((g) => {
      if (!mapObj.current) return;
      const bounds = new g.maps.LatLngBounds();
      const f = focusStop();
      if (f) bounds.extend(f);
      bounds.extend(driverPos.current ?? origin);
      glideCamera(mapObj.current, bounds.getCenter().toJSON(), zoomForBounds(mapObj.current, bounds));
    });
  };

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />

      {(geoMsg || !hasFix) && (
        <div className="absolute left-1/2 top-3 max-w-[80%] -translate-x-1/2 rounded-full bg-background/90 px-3 py-1.5 text-center text-xs font-medium text-muted-foreground shadow backdrop-blur">
          {geoMsg ?? "Tražim GPS…"}
        </div>
      )}

      <div className="absolute right-3 top-3">
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
