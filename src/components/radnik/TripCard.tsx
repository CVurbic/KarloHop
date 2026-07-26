import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Circle,
  Loader2,
  MessageCircle,
  MapPin,
  Phone,
  PartyPopper,
  Camera,
  X,
  Minus,
  Plus,
} from "lucide-react";
import { BOUNCERS } from "@/components/BookingCalendar";
import { RouteMap, type RadnikStop, type RouteResult } from "./RouteMap";
import { loadGoogleMaps } from "@/lib/googleMaps";

const NAPUHANAC_LABELS: Record<string, string> = {
  Jednorog: "Jednorog svijet",
  "Minecraft Party": "Minecraft party",
  "Dino Park": "Dino park",
  "Paw Patrol": "Paw Patrol avantura",
  "Nogometni izazov": "Nogometni izazov",
  "Super Mario": "Super Mario Tobogan",
};

function napuhanacLabels(names: string[]) {
  return names.map((n) => NAPUHANAC_LABELS[n] ?? n).join(", ");
}

function baseItems(count: number) {
  const items: string[] = [];
  for (let n = 1; n <= count; n++) {
    items.push(count > 1 ? `napuhanac ${n}` : "napuhanac");
    items.push(count > 1 ? `puhalica ${n}` : "puhalica");
  }
  return items;
}

function gearItems(count: number) {
  return [...baseItems(count), "produžni kabel", "cerada"];
}

// jedna destinacija po stopu -> uvijek tocna navigacija cak i nakon rucnog reordera
export function navHref(stop: RadnikStop) {
  return `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}&travelmode=driving`;
}

type SavedTrip = {
  addresses: string[];
  reordered: boolean;
  started: boolean;
  stepIndex: number;
  finished: boolean;
  checked: string[];
  klinoviCount: Record<string, number>;
  notes: Record<string, string>;
};

// nastavak dostave nakon refresha -> ucitaj samo ako se skup adresa i dalje poklapa (isti dan/krug)
function loadSavedTrip(storageKey: string, stops: RadnikStop[]): SavedTrip | null {
  try {
    const raw = localStorage.getItem(`radnik-trip-${storageKey}`);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedTrip;
    const addresses = stops.map((s) => s.address);
    const sameSet =
      Array.isArray(data.addresses) &&
      data.addresses.length === addresses.length &&
      data.addresses.every((a) => addresses.includes(a));
    return sameSet ? data : null;
  } catch {
    return null;
  }
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolokacija nije dostupna"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 });
  });
}

// racuna vrijeme voznje OD trenutne GPS pozicije radnika (u trenutku slanja poruke), ne od skladista/pocetka rute
async function etaFromCurrentLocation(stop: RadnikStop): Promise<number | undefined> {
  try {
    const pos = await getCurrentPosition();
    const g = await loadGoogleMaps();
    const service = new g.maps.DirectionsService();
    const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
      service.route(
        {
          origin: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          destination: { lat: stop.lat, lng: stop.lng },
          travelMode: g.maps.TravelMode.DRIVING,
        },
        (result, status) => (status === "OK" && result ? resolve(result) : reject(new Error(status))),
      );
    });
    const seconds = result.routes[0]?.legs[0]?.duration?.value;
    return seconds ? Math.round(seconds / 60) : undefined;
  } catch {
    return undefined;
  }
}

function smsHref(stop: RadnikStop, eta?: number) {
  const labels = stop.napuhanac.map((n) => NAPUHANAC_LABELS[n] ?? n).filter(Boolean);
  const itemsText = labels.length > 1 ? `napuhancima (${labels.join(", ")})` : labels[0] || "napuhancem";
  const msg =
    eta !== undefined
      ? `Pozdrav, za ${eta} min smo kod Vas s Vašim ${itemsText}. Vaš HopHopNapuhanci tim.`
      : `Pozdrav, krećemo prema Vama s Vašim ${itemsText}. Vaš HopHopNapuhanci tim.`;
  const phone = stop.phone.replace(/[^\d+]/g, "");
  return `sms:${phone}?body=${encodeURIComponent(msg)}`;
}

export function TripCard({
  index,
  origin,
  stops,
  storageKey,
  onActiveStopChange,
}: {
  index: number;
  origin: { lat: number; lng: number };
  stops: RadnikStop[];
  storageKey: string;
  onActiveStopChange?: (stop: RadnikStop | null) => void;
}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => loadSavedTrip(storageKey, stops), []);

  const [route, setRoute] = useState<RouteResult | null>(null);
  const [orderedStops, setOrderedStops] = useState<RadnikStop[]>(() =>
    saved ? saved.addresses.map((a) => stops.find((s) => s.address === a)).filter((s): s is RadnikStop => !!s) : stops,
  );
  const [reordered, setReordered] = useState(saved?.reordered ?? false);
  const [started, setStarted] = useState(saved?.started ?? false);
  const [stepIndex, setStepIndex] = useState(saved?.stepIndex ?? 0);
  const [finished, setFinished] = useState(saved?.finished ?? false);

  // checklist = sto je ostavljeno/postavljeno NA lokaciji, ne sto je ukrcano u kombi -> krece prazno
  const [checked, setChecked] = useState<Set<string>>(() => new Set(saved?.checked ?? []));

  // ponytail: foto ostaje lokalno (object URL), upload/storage (Supabase ili Google Drive) TBD -> za sada samo opcionalan dokaz na uredaju, ne prezivi refresh
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const photoInputRef = useRef<HTMLInputElement>(null);

  const setPhoto = (stopKey: string, file: File | null) => {
    if (!file) return;
    setPhotos((prev) => ({ ...prev, [stopKey]: URL.createObjectURL(file) }));
  };

  const removePhoto = (stopKey: string) => {
    setPhotos((prev) => {
      const next = { ...prev };
      delete next[stopKey];
      return next;
    });
  };

  const [klinoviCount, setKlinoviCount] = useState<Record<string, number>>(saved?.klinoviCount ?? {});
  const changeKlinovi = (stopKey: string, delta: number) => {
    setKlinoviCount((prev) => ({ ...prev, [stopKey]: Math.max(0, (prev[stopKey] ?? 0) + delta) }));
  };

  const [notes, setNotes] = useState<Record<string, string>>(saved?.notes ?? {});

  const [smsLoading, setSmsLoading] = useState(false);
  const sendEtaSms = async (stop: RadnikStop) => {
    setSmsLoading(true);
    const eta = await etaFromCurrentLocation(stop);
    setSmsLoading(false);
    window.location.href = smsHref(stop, eta);
  };

  useEffect(() => {
    if (route && !reordered) setOrderedStops(route.stops);
  }, [route, reordered]);

  useEffect(() => {
    const data: SavedTrip = {
      addresses: orderedStops.map((s) => s.address),
      reordered,
      started,
      stepIndex,
      finished,
      checked: [...checked],
      klinoviCount,
      notes,
    };
    try {
      localStorage.setItem(`radnik-trip-${storageKey}`, JSON.stringify(data));
    } catch {
      // ponytail: storage full/privatni mod -> nastavak dostave tada nece raditi, ne blokiraj app
    }
  }, [orderedStops, reordered, started, stepIndex, finished, checked, klinoviCount, notes, storageKey]);

  const toggleItem = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const moveStop = (i: number, dir: -1 | 1) => {
    setOrderedStops((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setReordered(true);
  };

  const totalNapuhanaca = stops.reduce((sum, s) => sum + s.napuhanac.length, 0);
  const activeStop = orderedStops[stepIndex];

  // globalni FAB (RadnikPage) treba znati koja je lokacija aktivna da ponudi "Karta" akciju
  useEffect(() => {
    onActiveStopChange?.(started ? activeStop ?? null : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, activeStop]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => onActiveStopChange?.(null);
  }, []);

  const advance = () => {
    if (stepIndex < orderedStops.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      setFinished(true);
      setStarted(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {index + 1}
          </span>
          Krug {index + 1} ({stops.length} {stops.length === 1 ? "lokacija" : "lokacije"} · {totalNapuhanaca}{" "}
          {totalNapuhanaca === 1 ? "napuhanac" : "napuhanaca"})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RouteMap origin={origin} stops={stops} onRoute={setRoute} />

        <div className="space-y-3">
          {orderedStops.map((s, i) => {
            const label = napuhanacLabels(s.napuhanac);
            const items = gearItems(s.napuhanac.length);
            const allChecked = items.every((item) => checked.has(`${s.address}-${item}`));
            return (
              <motion.div
                layout
                key={s.address}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className={`flex items-stretch gap-0 rounded-xl border overflow-hidden text-sm ${allChecked ? "border-green-300 bg-green-50/60 dark:bg-green-950/20" : "bg-muted/40"}`}
              >
                <div className="flex w-1.5 shrink-0 flex-col">
                  {s.napuhanac.map((name, ni) => {
                    const bouncer = BOUNCERS.find((b) => b.name === name);
                    return <div key={ni} className={`flex-1 ${bouncer?.dotColor ?? "bg-muted-foreground/30"}`} />;
                  })}
                </div>
                {!started && orderedStops.length > 1 && (
                  <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 px-1">
                    <button
                      disabled={i === 0}
                      onClick={() => moveStop(i, -1)}
                      aria-label="Pomakni gore"
                      className="cursor-pointer p-0.5 text-muted-foreground hover:text-foreground disabled:cursor-default disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      disabled={i === orderedStops.length - 1}
                      onClick={() => moveStop(i, 1)}
                      aria-label="Pomakni dolje"
                      className="cursor-pointer p-0.5 text-muted-foreground hover:text-foreground disabled:cursor-default disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="flex-1 space-y-2 p-3.5">
                  <div>
                    <span className="font-semibold">
                      {allChecked && "✓ "}
                      {i + 1}. {s.name}
                    </span>
                    <span className="text-muted-foreground"> ({s.phone || "nema broja"})</span>
                  </div>
                  <div className="text-muted-foreground">{s.address}</div>
                  <div className="text-muted-foreground">{label}</div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-2 border-t">
                    {items.map((item) => (
                      <label key={item} className="flex items-center gap-1.5">
                        <Checkbox
                          checked={checked.has(`${s.address}-${item}`)}
                          onCheckedChange={() => toggleItem(`${s.address}-${item}`)}
                        />
                        {item}
                      </label>
                    ))}
                    <div className="flex items-center gap-1.5">
                      <span>klinovi</span>
                      <button
                        onClick={() => changeKlinovi(s.address, -1)}
                        aria-label="Manje klinova"
                        className="cursor-pointer rounded-full border p-0.5 text-muted-foreground hover:bg-muted"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-4 text-center font-medium">{klinoviCount[s.address] ?? 0}</span>
                      <button
                        onClick={() => changeKlinovi(s.address, 1)}
                        aria-label="Više klinova"
                        className="cursor-pointer rounded-full border p-0.5 text-muted-foreground hover:bg-muted"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {finished ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-green-300 bg-green-50/60 py-2.5 text-sm font-medium text-green-700 dark:bg-green-950/20 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Dostava završena
          </div>
        ) : (
          route && (
            <Button className="w-full" onClick={() => setStarted(true)}>
              {stepIndex > 0 ? `Nastavi dostavu (${stepIndex + 1}/${orderedStops.length})` : "Započni dostavu"}
            </Button>
          )
        )}
      </CardContent>

      <AnimatePresence>
        {started && activeStop && (
          <motion.div
            key="delivery-screen"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-40 flex flex-col bg-background"
          >
            <>
              <div className="flex items-center gap-3 border-b px-4 pb-3 pt-4">
                <button
                  onClick={() => setStarted(false)}
                  aria-label="Natrag na pregled"
                  className="-ml-2 cursor-pointer rounded-full p-2 text-muted-foreground hover:bg-muted"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <p className="font-semibold leading-tight">{activeStop.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Dostava {stepIndex + 1} od {orderedStops.length}
                  </p>
                </div>
              </div>

              <div className="flex gap-1 px-4 pb-4 pt-3">
                {orderedStops.map((_, si) => (
                  <div key={si} className={`h-1 flex-1 rounded-full ${si <= stepIndex ? "bg-primary" : "bg-muted"}`} />
                ))}
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
                <div className="space-y-2.5 rounded-xl bg-muted/40 p-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{activeStop.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PartyPopper className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{napuhanacLabels(activeStop.napuhanac)}</span>
                  </div>
                  {activeStop.phone && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{activeStop.phone}</span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        disabled={smsLoading}
                        onClick={() => sendEtaSms(activeStop)}
                        aria-label="Pošalji SMS s procjenom dolaska od trenutne lokacije"
                      >
                        {smsLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MessageCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Postavljeno na lokaciji</p>
                  <div className="flex flex-wrap gap-1.5">
                    {gearItems(activeStop.napuhanac.length).map((item) => {
                      const isChecked = checked.has(`${activeStop.address}-${item}`);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleItem(`${activeStop.address}-${item}`)}
                          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            isChecked
                              ? "border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/40 dark:text-green-300"
                              : "border-input bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {isChecked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                          {item}
                        </button>
                      );
                    })}
                    <div className="inline-flex items-center gap-2 rounded-full border border-input px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      <span>klinovi</span>
                      <button
                        onClick={() => changeKlinovi(activeStop.address, -1)}
                        aria-label="Manje klinova"
                        className="cursor-pointer rounded-full p-0.5 hover:bg-muted"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-4 text-center text-foreground">{klinoviCount[activeStop.address] ?? 0}</span>
                      <button
                        onClick={() => changeKlinovi(activeStop.address, 1)}
                        aria-label="Više klinova"
                        className="cursor-pointer rounded-full p-0.5 hover:bg-muted"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Napomena</p>
                  <Textarea
                    value={notes[activeStop.address] ?? ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [activeStop.address]: e.target.value }))}
                    placeholder="npr. ostavljeno kod susjeda, kupac zvao..."
                    className="min-h-16 resize-none text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Foto dokaz (opcionalno)</p>
                  {photos[activeStop.address] ? (
                    <div className="relative h-24 w-24">
                      <img
                        src={photos[activeStop.address]}
                        alt="Postavljeni napuhanac"
                        className="h-24 w-24 rounded-xl border object-cover"
                      />
                      <button
                        onClick={() => removePhoto(activeStop.address)}
                        aria-label="Ukloni sliku"
                        className="absolute -right-2 -top-2 cursor-pointer rounded-full border bg-background p-1 shadow"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-muted-foreground hover:bg-muted/50"
                    >
                      <Camera className="h-5 w-5" />
                      <span className="text-[10px]">Slikaj</span>
                    </button>
                  )}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => setPhoto(activeStop.address, e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              <div className="flex flex-row items-center justify-between gap-2 border-t p-4">
                <Button
                  variant="ghost"
                  disabled={stepIndex === 0}
                  onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                >
                  ← Nazad
                </Button>
                <Button size="lg" onClick={advance}>
                  {stepIndex < orderedStops.length - 1 ? "Sljedeća lokacija →" : "Završi dostavu ✓"}
                </Button>
              </div>
            </>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
