import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { searchAddress, reverseGeocode, type AddressHit, type LatLng } from "@/lib/geo";

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  onLocationChange: (loc: LatLng | null) => void;
  onBlur?: () => void;
  placeholder?: string;
};

const DEBOUNCE_SUGGEST = 300;
const DEBOUNCE_TYPE_GEOCODE = 700;
const DEBOUNCE_REVERSE = 500;
const ZAGREB: LatLng = { lat: 45.815, lng: 15.982 };

// Adresno polje s ugrađenom kartom: autocomplete (Photon) + karta koja se "spusti" čim
// korisnik krene tipkati. Fiksni pin = centar karte; pomicanjem karte se namješta lokacija,
// a pin prati i upisanu adresu (rijedak geocode na pauzu u tipkanju). Sve preko besplatnog
// OpenStreetMap-a, bez API ključa.
export default function AddressPicker({ value, onValueChange, onLocationChange, onBlur, placeholder }: Props) {
  const [suggestions, setSuggestions] = useState<AddressHit[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapObj = useRef<L.Map | null>(null);
  // tekst za koji je karta zadnji put namještena -> ne geokodiraj isti string opet
  const settledText = useRef("");
  // programsko pomicanje karte ne smije se tretirati kao korisnički pomak
  const skipMove = useRef(false);

  // callbackovi bez re-triggeranja effecta ako roditelj šalje inline arrow
  const onLocRef = useRef(onLocationChange);
  const onValRef = useRef(onValueChange);
  useEffect(() => {
    onLocRef.current = onLocationChange;
    onValRef.current = onValueChange;
  });

  // otvori kartu kad korisnik ozbiljno krene tipkati, zatvori kad isprazni polje
  useEffect(() => {
    const len = value.trim().length;
    if (len >= 3) setExpanded(true);
    else if (len === 0) {
      setExpanded(false);
      setHint(null);
      settledText.current = "";
    }
  }, [value]);

  // programski pomak karte na koordinate (bez okidanja "korisnik je pomaknuo kartu")
  const moveMapTo = (loc: LatLng, zoom = 16) => {
    if (!mapObj.current) return;
    skipMove.current = true;
    mapObj.current.setView([loc.lat, loc.lng], zoom);
    onLocRef.current(loc);
  };

  // init Leaflet karte kad se panel prvi put otvori
  useEffect(() => {
    if (!expanded || !mapEl.current || mapObj.current) return;

    const map = L.map(mapEl.current, {
      fadeAnimation: false,
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView(ZAGREB, 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    mapObj.current = map;

    let revTimer: ReturnType<typeof setTimeout>;
    map.on("moveend", () => {
      if (skipMove.current) {
        skipMove.current = false;
        return;
      }
      const c = map.getCenter();
      onLocRef.current({ lat: c.lat, lng: c.lng });
      clearTimeout(revTimer);
      revTimer = setTimeout(async () => {
        const addr = await reverseGeocode(c.lat, c.lng);
        setHint(addr);
        if (addr) {
          // pin -> upiši adresu u polje; settledText da forward-geocode ne vrati pin natrag
          settledText.current = addr;
          onValRef.current(addr);
        }
      }, DEBOUNCE_REVERSE);
    });

    // panel se otvara animirano -> container krene od 0px, Leaflet treba invalidateSize
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(mapEl.current);
    const settle = setTimeout(() => map.invalidateSize(), 350);

    return () => {
      clearTimeout(revTimer);
      clearTimeout(settle);
      ro.disconnect();
      map.remove();
      mapObj.current = null;
    };
  }, [expanded]);

  // autocomplete dropdown
  useEffect(() => {
    const q = value.trim();
    if (q.length < 3 || q === settledText.current) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const hits = await searchAddress(q, ctrl.signal);
        setSuggestions(hits);
        setDropdownOpen(hits.length > 0);
      } catch {
        /* aborted — noviji zahtjev je u tijeku */
      }
    }, DEBOUNCE_SUGGEST);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  // "pin prati tekst": tihi forward geocode dok korisnik tipka (samo na pauzu, rijetko)
  useEffect(() => {
    const q = value.trim();
    if (!expanded || q.length < 5 || q === settledText.current) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const hits = await searchAddress(q, ctrl.signal);
        if (hits[0]) {
          settledText.current = q;
          moveMapTo({ lat: hits[0].lat, lng: hits[0].lng });
        }
      } catch {
        /* aborted */
      }
    }, DEBOUNCE_TYPE_GEOCODE);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, expanded]);

  const pick = (h: AddressHit) => {
    settledText.current = h.label;
    onValueChange(h.label);
    setSuggestions([]);
    setDropdownOpen(false);
    setExpanded(true);
    setHint(h.label);
    // karta se možda tek montira nakon setExpanded -> pokušaj odmah, pa retry
    if (mapObj.current) moveMapTo({ lat: h.lat, lng: h.lng });
    else setTimeout(() => moveMapTo({ lat: h.lat, lng: h.lng }), 400);
  };

  return (
    <div>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={value}
          autoComplete="off"
          onChange={(e) => onValueChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setDropdownOpen(true)}
          onBlur={() => {
            setTimeout(() => setDropdownOpen(false), 150);
            onBlur?.();
          }}
        />
        {dropdownOpen && (
          <ul className="absolute z-[1000] mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
            {suggestions.map((s, i) => (
              <li key={`${s.label}-${i}`}>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(s)}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="relative mt-2 h-60 w-full overflow-hidden rounded-lg border bg-muted">
            <div ref={mapEl} className="h-full w-full" />
            {/* fiksni pin na sredini — vrh šiljka pokazuje točan centar karte */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-full">
              <svg
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="#0BA6DE"
                stroke="white"
                strokeWidth={1.5}
                className="drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]"
              >
                <path d="M12 22s7-6 7-12A7 7 0 0 0 5 10c0 6 7 12 7 12z" />
                <circle cx="12" cy="10" r="2.6" fill="white" />
              </svg>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {hint ? `Pin: ${hint}` : "Pomaknite kartu da namjestite pin na točnu lokaciju."}
          </p>
        </div>
      </div>
    </div>
  );
}
