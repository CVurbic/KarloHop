import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  lat: number;
  lng: number;
  onConfirm: (address: string, lat: number, lng: number) => void;
}

// Photon (OpenStreetMap) reverse geocode — besplatno, bez ključa.
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=default`);
    const data = await res.json();
    const p = data.features?.[0]?.properties;
    if (!p) return null;
    const street = [p.street ?? p.name, p.housenumber].filter(Boolean).join(" ");
    const city = p.city ?? p.town ?? p.village ?? p.county;
    return [street, city].filter(Boolean).join(", ") || null;
  } catch {
    return null;
  }
}

const LocationConfirmDialog = ({ open, onOpenChange, address, lat, lng, onConfirm }: LocationConfirmDialogProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [currentAddress, setCurrentAddress] = useState(address);
  const [currentLat, setCurrentLat] = useState(lat);
  const [currentLng, setCurrentLng] = useState(lng);

  useEffect(() => {
    if (!open || !mapRef.current) return;
    setCurrentAddress(address);
    setCurrentLat(lat);
    setCurrentLng(lng);

    // fadeAnimation:false -> tiles se ne "zaglave" na opacity:0 kad se karta inicira dok dialog animira
    const map = L.map(mapRef.current, { fadeAnimation: false }).setView([lat, lng], 17);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    // dialog open animacija ~200ms -> jedan invalidateSize kad sjedne
    const settleTimer = setTimeout(() => map.invalidateSize(), 300);

    // pin je fiksni CSS overlay na sredini -> lokacija = centar karte, pomicanjem karte se namješta
    let geocodeTimer: ReturnType<typeof setTimeout>;
    map.on("moveend", () => {
      const c = map.getCenter();
      setCurrentLat(c.lat);
      setCurrentLng(c.lng);
      clearTimeout(geocodeTimer);
      geocodeTimer = setTimeout(async () => {
        const addr = await reverseGeocode(c.lat, c.lng);
        if (addr) setCurrentAddress(addr);
      }, 350);
    });

    // dialog se otvara s animacijom -> container krene od 0px i Leaflet ne složi tiles.
    // ResizeObserver pozove invalidateSize svaki put kad se veličina promijeni (i kad animacija sjedne).
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(mapRef.current);

    return () => {
      clearTimeout(geocodeTimer);
      clearTimeout(settleTimer);
      ro.disconnect();
      map.remove();
    };
  }, [open, address, lat, lng]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Potvrdite lokaciju dostave
          </DialogTitle>
        </DialogHeader>

        <div className="relative h-72 w-full rounded-lg overflow-hidden bg-muted">
          <div ref={mapRef} className="h-full w-full" />
          {/* fiksni pin na sredini — vrh šiljka pokazuje točan centar karte */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-full">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="#0BA6DE" stroke="white" strokeWidth={1.5}
              className="drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]">
              <path d="M12 22s7-6 7-12A7 7 0 0 0 5 10c0 6 7 12 7 12z" />
              <circle cx="12" cy="10" r="2.6" fill="white" />
            </svg>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{currentAddress}</p>
        <p className="text-xs text-muted-foreground">Pomaknite kartu da namjestite pin na točnu lokaciju.</p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Odustani
          </Button>
          <Button onClick={() => onConfirm(currentAddress, currentLat, currentLng)}>
            Potvrdi lokaciju
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LocationConfirmDialog;
