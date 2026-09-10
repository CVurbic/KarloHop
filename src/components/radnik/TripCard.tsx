import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertTriangle,
} from "lucide-react";
import { RouteMap, type RadnikStop, type RouteResult } from "./RouteMap";
import { LiveTripMap } from "./LiveTripMap";
import { drivingRoute } from "@/lib/geo";
import { format } from "date-fns";
import { useMessageTemplate, fillTemplate } from "@/hooks/useMessageTemplates";
import { useBookingReports, useUpsertBookingReport } from "@/hooks/useBookingReports";
import { uploadRadnikPhoto } from "@/lib/uploadImage";
import { supabase } from "@/integrations/supabase/client";
import { napuhanci } from "@/data/products";
import { useAllBounceHouses } from "@/hooks/useBounceHouseOptions";
import { toBounceHouseSlug } from "@/lib/bounceHouseCompat";

type Mode = "delivery" | "pickup";

type Handoff = { klinovi: number | null; note: string | null; photos: string[]; deliveredAt: string | null };

// "Info od dostave" — sto je jutarnja smjena zabiljezila na lokaciji (klinovi, napomena, foto postavljanja)
function DeliveryInfo({ h }: { h: Handoff }) {
  if (h.note == null && h.klinovi == null && h.photos.length === 0) return null;
  return (
    <div className="space-y-1.5 rounded-xl border border-amber-300 bg-amber-50/70 p-3 text-xs dark:border-amber-900/60 dark:bg-amber-950/20">
      <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        Info od dostave
        {h.deliveredAt && (
          <span className="font-normal text-muted-foreground">· {format(new Date(h.deliveredAt), "d.M. HH:mm")}</span>
        )}
      </div>
      {h.klinovi != null && (
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Klinovi zabijeno:</span> {h.klinovi}
        </p>
      )}
      {h.note && (
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Napomena:</span> {h.note}
        </p>
      )}
      {h.photos.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {h.photos.map((p) => (
            <SignedRadnikImage key={p} path={p} className="h-20 w-20 shrink-0" />
          ))}
        </div>
      )}
    </div>
  );
}

// radnik-photos je privatan bucket -> path se pretvara u signed URL pri prikazu (1h)
function SignedRadnikImage({ path, className = "" }: { path: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    supabase.storage
      .from("radnik-photos")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (alive) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      alive = false;
    };
  }, [path]);
  if (!url) return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
  return <img src={url} alt="Foto s dostave" className={`rounded-lg border object-cover ${className}`} />;
}

const MODE_COPY = {
  delivery: {
    start: "Započni dostavu",
    resume: "Nastavi dostavu",
    done: "Dostava završena",
    step: "Dostava",
    finish: "Završi dostavu ✓",
    checklist: "Postavljeno na lokaciji",
  },
  pickup: {
    start: "Započni skupljanje",
    resume: "Nastavi skupljanje",
    done: "Skupljanje završeno",
    step: "Skupljanje",
    finish: "Završi skupljanje ✓",
    checklist: "Utovareno u kombi",
  },
} as const;

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

// isti naziv koristi se za image lookup u products.ts (NAPUHANAC_LABELS vrijednosti = products.ts name polje)
function napuhanacImage(name: string): string | undefined {
  const label = NAPUHANAC_LABELS[name] ?? name;
  return napuhanci.find((p) => p.name === label)?.coverImage;
}

// dva eksplicitna gumba (Pozovi / Poruka) umjesto skrivenog izbornika -> ocito je klikabilno bez pogadanja
function PhoneActions({
  stop,
  smsLoading,
  onSendSms,
  className = "",
}: {
  stop: RadnikStop;
  smsLoading: boolean;
  onSendSms: (stop: RadnikStop) => void;
  className?: string;
}) {
  if (!stop.phone) return null;
  return (
    // broj se steže (truncate), gumbi ostaju desno -> nikad ne overflowa ni ne pada u novi red
    <div className={`flex min-w-0 items-center gap-1.5 ${className}`}>
      <span className="min-w-0 flex-1 truncate">{stop.phone}</span>
      <a
        href={`tel:${stop.phone}`}
        onClick={(e) => e.stopPropagation()}
        aria-label="Nazovi"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform hover:bg-primary/20 active:scale-90"
      >
        <Phone className="h-4 w-4" />
      </a>
      <button
        type="button"
        disabled={smsLoading}
        onClick={(e) => {
          e.stopPropagation();
          onSendSms(stop);
        }}
        aria-label="Pošalji poruku s procjenom dolaska"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform hover:bg-primary/20 active:scale-90 disabled:opacity-50"
      >
        {smsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
      </button>
    </div>
  );
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
  condition: Record<string, "ok" | "damage">;
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
    const r = await drivingRoute(
      { lat: pos.coords.latitude, lng: pos.coords.longitude },
      { lat: stop.lat, lng: stop.lng },
    );
    return r?.minutes;
  } catch {
    return undefined;
  }
}

const DEFAULT_ETA_TEMPLATE = "Pozdrav, za {min} min smo kod Vas s Vašim {stavke}. Vaš HopHopNapuhanci tim.";
const DEFAULT_ETA_FALLBACK_TEMPLATE = "Pozdrav, krećemo prema Vama s Vašim {stavke}. Vaš HopHopNapuhanci tim.";

function smsHref(stop: RadnikStop, eta: number | undefined, etaTemplate: string, fallbackTemplate: string) {
  const labels = stop.napuhanac.map((n) => NAPUHANAC_LABELS[n] ?? n).filter(Boolean);
  const itemsText = labels.length > 1 ? `napuhancima (${labels.join(", ")})` : labels[0] || "napuhancem";
  const msg =
    eta !== undefined
      ? fillTemplate(etaTemplate, { min: String(eta), stavke: itemsText })
      : fillTemplate(fallbackTemplate, { stavke: itemsText });
  const phone = stop.phone.replace(/[^\d+]/g, "");
  return `sms:${phone}?body=${encodeURIComponent(msg)}`;
}

export function TripCard({
  index,
  mode = "delivery",
  origin,
  stops,
  storageKey,
  onActiveStopChange,
}: {
  index: number;
  mode?: Mode;
  origin: { lat: number; lng: number };
  stops: RadnikStop[];
  storageKey: string;
  onActiveStopChange?: (stop: RadnikStop | null) => void;
}) {
  const { data: bounceHouses = [] } = useAllBounceHouses();
  const L = MODE_COPY[mode];

  // skupljanje cita sto je dostava zabiljezila (klinovi, napomena); dostava samo pise
  const tripBookingIds = useMemo(() => stops.flatMap((s) => s.bookingIds ?? []), [stops]);
  const { data: reports = {} } = useBookingReports(mode === "pickup" ? tripBookingIds : []);
  const upsertReport = useUpsertBookingReport();

  const handoffFor = (stop: RadnikStop): Handoff => {
    for (const id of stop.bookingIds ?? []) {
      const r = reports[id];
      if (r && (r.klinovi_count != null || r.delivery_note || r.delivery_photo_paths?.length)) {
        return {
          klinovi: r.klinovi_count,
          note: r.delivery_note,
          photos: r.delivery_photo_paths ?? [],
          deliveredAt: r.delivered_at,
        };
      }
    }
    return { klinovi: null, note: null, photos: [], deliveredAt: null };
  };

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

  // lokalni preview (object URL) za instant feedback; path se paralelno uploada u radnik-photos
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [photoUploading, setPhotoUploading] = useState<Record<string, boolean>>({});
  const photoInputRef = useRef<HTMLInputElement>(null);

  const setPhoto = async (stop: RadnikStop, file: File | null) => {
    if (!file) return;
    setPhotos((prev) => ({ ...prev, [stop.address]: URL.createObjectURL(file) }));
    // upload + zapis path-a: dostava -> delivery_photo_paths (skupljanje ju prikaze), skupljanje -> pickup_photo_paths
    setPhotoUploading((prev) => ({ ...prev, [stop.address]: true }));
    for (const booking_id of stop.bookingIds ?? []) {
      const path = await uploadRadnikPhoto(file, booking_id);
      // ponytail: jedna slika po lokaciji; retake zamijeni path (stara datoteka ostaje u bucketu, admin-only brisanje)
      if (!path) continue;
      if (mode === "pickup") upsertReport.mutate({ booking_id, pickup_photo_paths: [path] });
      else upsertReport.mutate({ booking_id, delivery_photo_paths: [path] });
    }
    setPhotoUploading((prev) => ({ ...prev, [stop.address]: false }));
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

  // skupljanje: stanje napuhanca pri povratu -> zapis u booking_reports.pickup_condition
  const [condition, setCondition] = useState<Record<string, "ok" | "damage">>(saved?.condition ?? {});

  const { data: etaTemplate } = useMessageTemplate("eta_sms");
  const { data: etaFallbackTemplate } = useMessageTemplate("eta_sms_fallback");

  const [smsLoading, setSmsLoading] = useState(false);
  const sendEtaSms = async (stop: RadnikStop) => {
    setSmsLoading(true);
    const eta = await etaFromCurrentLocation(stop);
    setSmsLoading(false);
    window.location.href = smsHref(
      stop,
      eta,
      etaTemplate?.body ?? DEFAULT_ETA_TEMPLATE,
      etaFallbackTemplate?.body ?? DEFAULT_ETA_FALLBACK_TEMPLATE,
    );
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
      condition,
    };
    try {
      localStorage.setItem(`radnik-trip-${storageKey}`, JSON.stringify(data));
    } catch {
      // ponytail: storage full/privatni mod -> nastavak smjene tada nece raditi, ne blokiraj app
    }
  }, [orderedStops, reordered, started, stepIndex, finished, checked, klinoviCount, notes, condition, storageKey]);

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

  // info panel u ekranu dostave: spušten (vidi se karta) / podignut (checklist) -> karta se resize-a između
  const [sheetExpanded, setSheetExpanded] = useState(false);

  // globalni FAB (RadnikPage) treba znati koja je lokacija aktivna da ponudi "Karta" akciju
  useEffect(() => {
    onActiveStopChange?.(started ? activeStop ?? null : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, activeStop]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => onActiveStopChange?.(null);
  }, []);

  // zapis u booking_reports pri napuštanju lokacije (best-effort; localStorage i dalje drži radnu kopiju)
  // ponytail: offline -> mutacija faila tiho, nema retry queue-a; dodaj kad zatreba
  // finished -> pregled/ispravak; upsertaj izmjene ali ne diraj originalni timestamp završetka
  const persistStop = (stop: RadnikStop) => {
    const iso = new Date().toISOString();
    const stamp = finished ? {} : mode === "pickup" ? { picked_up_at: iso } : { delivered_at: iso };
    for (const booking_id of stop.bookingIds ?? []) {
      if (mode === "pickup") {
        upsertReport.mutate({
          booking_id,
          pickup_condition: condition[stop.address] ?? "ok",
          pickup_note: notes[stop.address]?.trim() || null,
          ...stamp,
        });
      } else {
        upsertReport.mutate({
          booking_id,
          klinovi_count: klinoviCount[stop.address] ?? null,
          delivery_note: notes[stop.address]?.trim() || null,
          ...stamp,
        });
      }
    }
  };

  const advance = () => {
    persistStop(orderedStops[stepIndex]);
    setSheetExpanded(false); // sljedeća lokacija -> spusti panel da vozač vidi kartu
    if (stepIndex < orderedStops.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      if (!finished) setFinished(true);
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
            return (
              <motion.div
                layout
                key={s.address}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-stretch gap-0 rounded-xl border bg-muted/40 overflow-hidden text-sm"
              >
                <div className="flex w-1.5 shrink-0 flex-col">
                  {s.napuhanac.map((name, ni) => {
                    const bouncer = bounceHouses.find((b) => b.slug === toBounceHouseSlug(name));
                    return (
                      <div
                        key={ni}
                        className={`flex-1 ${!bouncer?.color ? "bg-muted-foreground/30" : ""}`}
                        style={bouncer?.color ? { backgroundColor: bouncer.color } : undefined}
                      />
                    );
                  })}
                </div>
                <div
                  className={`min-w-0 flex-1 space-y-2.5 p-3 ${finished ? "cursor-pointer transition-colors hover:bg-muted/70" : ""}`}
                  {...(finished
                    ? {
                      role: "button",
                      tabIndex: 0,
                      title: `Otvori ${L.step.toLowerCase()}`,
                      onClick: () => {
                        setStepIndex(i);
                        setStarted(true);
                      },
                      onKeyDown: (e: { key: string; preventDefault: () => void }) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setStepIndex(i);
                          setStarted(true);
                        }
                      },
                    }
                    : {})}
                >
                  <div className="flex gap-3">
                    {napuhanacImage(s.napuhanac[0]) && (
                      <img
                        src={napuhanacImage(s.napuhanac[0])}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-lg border object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold leading-tight">
                        {i + 1}. {s.name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{label}</div>
                      <div className="mt-1 break-words text-xs text-muted-foreground">{s.address}</div>
                    </div>
                    {!started && !finished && orderedStops.length > 1 && (
                      <div className="-my-1 flex shrink-0 flex-col">
                        <button
                          disabled={i === 0}
                          onClick={() => moveStop(i, -1)}
                          aria-label="Pomakni gore"
                          className="flex h-7 w-7 cursor-pointer items-center justify-center text-muted-foreground transition-transform hover:text-foreground active:scale-90 disabled:opacity-25 disabled:active:scale-100"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          disabled={i === orderedStops.length - 1}
                          onClick={() => moveStop(i, 1)}
                          aria-label="Pomakni dolje"
                          className="flex h-7 w-7 cursor-pointer items-center justify-center text-muted-foreground transition-transform hover:text-foreground active:scale-90 disabled:opacity-25 disabled:active:scale-100"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {s.phone ? (
                    <div className="rounded-lg bg-background/60 px-2.5 py-1">
                      <PhoneActions stop={s} smsLoading={smsLoading} onSendSms={sendEtaSms} />
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">nema broja</div>
                  )}

                  {mode === "pickup" && <DeliveryInfo h={handoffFor(s)} />}
                </div>
              </motion.div>
            );
          })}
        </div>

        {finished ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-green-300 bg-green-50/60 py-2.5 text-sm font-medium text-green-700 dark:bg-green-950/20 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              {L.done}
            </div>
            <p className="text-center text-xs text-muted-foreground">Klikni lokaciju za pregled</p>
          </div>
        ) : (
          route && (
            <Button className="w-full" onClick={() => setStarted(true)}>
              {stepIndex > 0 ? `${L.resume} (${stepIndex + 1}/${orderedStops.length})` : L.start}
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
              {/* karta zauzima stvarni prostor iznad panela -> centar joj nije skriven */}
              <div className="relative min-h-0 flex-1 z-0">
                <LiveTripMap
                  origin={origin}
                  stops={orderedStops}
                  activeIndex={stepIndex}
                  onSelectStop={(i) => {
                    setStepIndex(i);
                    setSheetExpanded(false);
                  }}
                />

                <button
                  onClick={() => setStarted(false)}
                  aria-label="Natrag na pregled"
                  className="absolute left-3 top-3 z-[1000] flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-background/80 text-foreground shadow backdrop-blur transition-transform hover:bg-background active:scale-90"
                >
                  <ArrowLeft className="h-5 w-5 " />
                </button>

                {/* skok u Google Maps preko karte (rezerva za nepoznatu adresu) */}
                <a
                  href={navHref(activeStop)}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-[#3c4043] shadow-md transition-transform active:scale-95"
                >
                  <MapPin className="h-4 w-4 text-[#4285F4]" />
                  Google Maps
                </a>
              </div>

              {/* info panel — spušten (vidi se karta) / podignut (checklist); karta se resize-a između */}
              <div
                className={`relative z-10 flex shrink-0 flex-col overflow-hidden rounded-t-2xl border-t bg-background shadow-[0_-8px_24px_rgba(0,0,0,0.14)] transition-[height] duration-300 ease-out ${sheetExpanded ? "h-[62vh]" : "h-[190px]"
                  }`}
              >
                <button
                  type="button"
                  onClick={() => setSheetExpanded((v) => !v)}
                  aria-label={sheetExpanded ? "Spusti panel" : "Podigni panel"}
                  className="flex shrink-0 items-center justify-center py-2.5"
                >
                  <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
                </button>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
                  <div className="flex gap-1">
                    {orderedStops.map((_, si) => (
                      <div key={si} className={`h-1 flex-1 rounded-full ${si <= stepIndex ? "bg-primary" : "bg-muted"}`} />
                    ))}
                  </div>

                  <div>
                    <p className="font-semibold leading-tight">{activeStop.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {L.step} {stepIndex + 1} od {orderedStops.length}
                    </p>
                  </div>

                  {mode === "pickup" && <DeliveryInfo h={handoffFor(activeStop)} />}

                  <div className="flex gap-3">
                    <div className="min-w-0 flex-1 space-y-2.5 rounded-xl bg-muted/40 p-3 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>{activeStop.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PartyPopper className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>{napuhanacLabels(activeStop.napuhanac)}</span>
                      </div>
                      {activeStop.phone && (
                        <div className="flex min-w-0 items-center gap-2">
                          <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <PhoneActions stop={activeStop} smsLoading={smsLoading} onSendSms={sendEtaSms} className="min-w-0 flex-1" />
                        </div>
                      )}
                    </div>
                    {/* slika napuhanca (katalog) koji ide na ovu lokaciju -> radnik odmah zna koji uzima */}
                    {activeStop.napuhanac.some((n) => napuhanacImage(n)) && (
                      <div className="flex shrink-0 flex-col gap-2">
                        {activeStop.napuhanac.map((n, ni) => {
                          const img = napuhanacImage(n);
                          return img ? (
                            <img
                              key={ni}
                              src={img}
                              alt={napuhanacLabels([n])}
                              className="h-24 w-24 rounded-xl border object-cover"
                            />
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">{L.checklist}</p>
                    <div className="flex flex-wrap gap-2">
                      {gearItems(activeStop.napuhanac.length).map((item) => {
                        const isChecked = checked.has(`${activeStop.address}-${item}`);
                        return (
                          <button
                            key={item}
                            onClick={() => toggleItem(`${activeStop.address}-${item}`)}
                            className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-transform active:scale-95 ${isChecked
                              ? "border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/40 dark:text-green-300"
                              : "border-input bg-background text-muted-foreground hover:bg-muted"
                              }`}
                          >
                            {isChecked ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                            {item}
                          </button>
                        );
                      })}
                      <div className="inline-flex min-h-9 items-center gap-1 rounded-full border border-input pl-3.5 pr-1.5 text-sm font-medium text-muted-foreground">
                        <span>{mode === "pickup" ? "klinovi izvađeno" : "klinovi"}</span>
                        <button
                          onClick={() => changeKlinovi(activeStop.address, -1)}
                          aria-label="Manje klinova"
                          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-transform hover:bg-muted active:scale-90"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-5 text-center text-foreground">{klinoviCount[activeStop.address] ?? 0}</span>
                        <button
                          onClick={() => changeKlinovi(activeStop.address, 1)}
                          aria-label="Više klinova"
                          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-transform hover:bg-muted active:scale-90"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {mode === "pickup" && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Stanje pri povratu</p>
                      <div className="flex gap-2">
                        {(["ok", "damage"] as const).map((c) => {
                          const active = (condition[activeStop.address] ?? "ok") === c;
                          const on =
                            c === "ok"
                              ? "border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/40 dark:text-green-300"
                              : "border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300";
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setCondition((prev) => ({ ...prev, [activeStop.address]: c }))}
                              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-transform active:scale-95 ${active ? on : "border-input bg-background text-muted-foreground hover:bg-muted"
                                }`}
                            >
                              {c === "ok" ? "✓ Sve OK" : "⚠ Prijavi štetu"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Napomena</p>
                    <Textarea
                      value={notes[activeStop.address] ?? ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [activeStop.address]: e.target.value }))}
                      placeholder={
                        mode === "pickup"
                          ? "npr. sve pokupljeno, travnjak uredan..."
                          : "npr. ostavljeno kod susjeda, kupac zvao..."
                      }
                      className="min-h-16 resize-none text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      {mode === "pickup" ? "Foto pri povratu (opcionalno)" : "Foto postavljenog napuhanca (opcionalno)"}
                    </p>
                    {photos[activeStop.address] ? (
                      <div className="relative h-24 w-24">
                        <img
                          src={photos[activeStop.address]}
                          alt="Napuhanac"
                          className="h-24 w-24 rounded-xl border object-cover"
                        />
                        {photoUploading[activeStop.address] && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          </div>
                        )}
                        <button
                          onClick={() => removePhoto(activeStop.address)}
                          aria-label="Ukloni sliku"
                          className="absolute -right-2.5 -top-2.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border bg-background shadow transition-transform active:scale-90"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-muted-foreground transition-transform hover:bg-muted/50 active:scale-95"
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
                      onChange={(e) => setPhoto(activeStop, e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>
              </div>

              <div className="z-20 flex shrink-0 flex-row items-center justify-between gap-2 border-t bg-background p-4">
                <Button
                  variant="ghost"
                  size="lg"
                  disabled={stepIndex === 0}
                  onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                >
                  ← Nazad
                </Button>
                <Button size="lg" onClick={advance}>
                  {stepIndex < orderedStops.length - 1
                    ? "Sljedeća lokacija →"
                    : finished
                      ? "Zatvori pregled"
                      : L.finish}
                </Button>
              </div>
            </>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
