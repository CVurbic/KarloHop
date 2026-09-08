import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { hr } from "date-fns/locale";
import { CalendarDays, ChevronLeft, LogOut, MapPin, MapPinned, Phone, PartyPopper, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdmin } from "@/hooks/useAdmin";
import { useAllBookings } from "@/hooks/useBookings";
import { geocodeAddress } from "@/lib/geocode";
import { TripCard } from "@/components/radnik/TripCard";
import { OverviewMap } from "@/components/radnik/OverviewMap";
import { type RadnikStop } from "@/components/radnik/RouteMap";
import LocationConfirmDialog from "@/components/LocationConfirmDialog";
import { BookingCalendar } from "@/components/BookingCalendar";
import { useAllBounceHouses } from "@/hooks/useBounceHouseOptions";
import { toBounceHouseSlug } from "@/lib/bounceHouseCompat";

// mora odgovarati skladistu koje koristi ruta -> Lanište 26, Zagreb
const WAREHOUSE = { lat: 45.773021, lng: 15.9444089 };
// ponytail: flat count po voznji (ne size-units) — van stane max 3 napuhanca
const MAX_PER_TRIP = 3;

type LocalStop = RadnikStop & { geocodeFailed?: boolean };

type SavedSession = { selectedDate: string; stops: LocalStop[]; tripGroups: LocalStop[][] | null };

type Mode = "delivery" | "pickup";

// dvije smjene dijele isti tok (kalendar, karta, krugovi) -> razlikuje ih samo copy + izvor datuma + smjer checkliste
const COPY = {
  delivery: {
    title: "Ruta dana",
    brand: "Hop Hop Napuhanci — radnik",
    noStops: "Nema dostava za odabrani dan.",
    emptyTrips: "Krugovi za dostavu prikazat će se ovdje nakon što odabereš dan i izračunaš rutu.",
    perTrip: (n: number) => `Max ${n} napuhanca po vožnji — app sam dijeli u krugove i grupira po blizini.`,
  },
  pickup: {
    title: "Skupljanje dana",
    brand: "Hop Hop Napuhanci — skupljanje",
    noStops: "Nema skupljanja za odabrani dan.",
    emptyTrips: "Krugovi za skupljanje prikazat će se ovdje nakon što odabereš dan.",
    perTrip: (n: number) => `Max ${n} napuhanca po vožnji — app sam dijeli u krugove i grupira po blizini.`,
  },
} as const;

const sessionKey = (mode: Mode) => (mode === "pickup" ? "radnik-session-pickup" : "radnik-session");

// nastavak smjene nakon refresha/gasenja app-a na mobitelu -> spremi cijelu sesiju (odvojeno po smjeni)
function loadSession(mode: Mode): SavedSession | null {
  try {
    const raw = localStorage.getItem(sessionKey(mode));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function bearingFromWarehouse(p: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(p.lng - WAREHOUSE.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(p.lat));
  const x =
    Math.cos(toRad(WAREHOUSE.lat)) * Math.sin(toRad(p.lat)) -
    Math.sin(toRad(WAREHOUSE.lat)) * Math.cos(toRad(p.lat)) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

function normalizeAddress(addr: string) {
  return addr.trim().toLowerCase().replace(/\s+/g, " ");
}

// ista adresa = ista fizicka lokacija, cak i ako su odvojene rezervacije (npr. razlicito ime/tel)
// -> spoji u jedan stop s vise napuhanaca umjesto duplog prikaza iste lokacije
function mergeStopsByAddress(list: LocalStop[]): LocalStop[] {
  const merged: LocalStop[] = [];
  const indexByAddress = new Map<string, number>();

  for (const s of list) {
    const key = normalizeAddress(s.address);
    const existingIdx = indexByAddress.get(key);
    if (existingIdx === undefined) {
      indexByAddress.set(key, merged.length);
      merged.push({ ...s, napuhanac: [...s.napuhanac], bookingIds: [...(s.bookingIds ?? [])] });
    } else {
      const existing = merged[existingIdx];
      existing.napuhanac.push(...s.napuhanac);
      existing.bookingIds = [...(existing.bookingIds ?? []), ...(s.bookingIds ?? [])];
      if (!existing.phone && s.phone) existing.phone = s.phone;
      if (existing.geocodeFailed && !s.geocodeFailed) existing.geocodeFailed = false;
    }
  }
  return merged;
}

// sweep algoritam: grupira po smjeru od skladista, balansirano po MAX_PER_TRIP
// (4 napuhanca -> 2+2, ne 3+1 -- izbjegava rucnu procjenu grupiranja)
function groupIntoTrips(stops: LocalStop[]): LocalStop[][] {
  if (stops.length === 0) return [];
  const numTrips = Math.ceil(stops.length / MAX_PER_TRIP);
  const base = Math.floor(stops.length / numTrips);
  const remainder = stops.length % numTrips;
  const sizes = Array.from({ length: numTrips }, (_, i) => base + (i < remainder ? 1 : 0));

  const sorted = [...stops].sort((a, b) => bearingFromWarehouse(a) - bearingFromWarehouse(b));
  const trips: LocalStop[][] = [];
  let idx = 0;
  for (const size of sizes) {
    trips.push(sorted.slice(idx, idx + size));
    idx += size;
  }
  return trips;
}

export default function RadnikPage({ mode = "delivery" }: { mode?: Mode }) {
  const t = COPY[mode];
  const { signOut } = useAdmin();
  const navigate = useNavigate();
  const { data: allBookings, isLoading, isError, refetch } = useAllBookings();
  const { data: bounceHouses = [] } = useAllBounceHouses();
  // odbaci spremljenu sesiju od prije uvodenja bookingIds -> stari stopovi nemaju veze s booking_reports (handoff, foto)
  const savedSession = useMemo(() => {
    const s = loadSession(mode);
    if (s?.stops?.length && !s.stops.every((st) => st.bookingIds?.length)) return null;
    return s;
  }, [mode]);
  const [selectedDate, setSelectedDate] = useState<string | null>(savedSession?.selectedDate ?? null);
  const [currentMonth, setCurrentMonth] = useState(() =>
    savedSession?.selectedDate ? new Date(`${savedSession.selectedDate}T00:00:00`) : new Date(),
  );
  const [stops, setStops] = useState<LocalStop[]>(savedSession?.stops ?? []);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState("");
  const [tripGroups, setTripGroups] = useState<LocalStop[][] | null>(savedSession?.tripGroups ?? null);
  const [pinTarget, setPinTarget] = useState<number | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [autoFallback, setAutoFallback] = useState(false);
  const autoSelectedRef = useRef(!!savedSession?.selectedDate);

  useEffect(() => {
    try {
      if (!selectedDate) {
        localStorage.removeItem(sessionKey(mode));
        return;
      }
      localStorage.setItem(sessionKey(mode), JSON.stringify({ selectedDate, stops, tripGroups }));
    } catch {
      // ponytail: localStorage moze failati (privatni mod, full storage) -> nastavak smjene tada nece raditi, ne blokiraj app
    }
  }, [selectedDate, stops, tripGroups, mode]);

  const shiftBookings = useMemo(() => {
    const confirmed = (allBookings ?? []).filter((b) => b.status === "confirmed");
    if (mode !== "pickup") return confirmed;
    // dan skupljanja = kraj najma; jednodnevni najam nema end date -> isti dan kao dostava
    return confirmed.map((b) => ({
      ...b,
      booking_start_date: b.booking_end_date ?? b.booking_start_date,
    }));
  }, [allBookings, mode]);

  const selectedDateObj = useMemo(
    () => (selectedDate ? new Date(`${selectedDate}T00:00:00`) : null),
    [selectedDate],
  );

  const handleSelectDate = async (date: string, isAuto = false) => {
    setSelectedDate(date);
    setTripGroups(null);
    setError("");
    setAutoFallback(isAuto && date !== format(new Date(), "yyyy-MM-dd"));

    const forDate = shiftBookings.filter((b) => b.booking_start_date === date);
    if (forDate.length === 0) {
      setStops([]);
      return;
    }

    setGeocoding(true);
    const geocoded: LocalStop[] = [];

    await Promise.all(
      forDate.map(async (b) => {
        // koordinate su spremljene kod kreiranja rezervacije (BookingSection) --
        // geokodiraj samo starije rezervacije kojima jos fale
        const coords =
          b.lat != null && b.lng != null ? { lat: b.lat, lng: b.lng } : await geocodeAddress(b.delivery_address ?? "");
        geocoded.push({
          name: `${b.name} ${b.surname}`.trim(),
          phone: b.phone ?? "",
          address: b.delivery_address ?? "",
          lat: coords?.lat ?? 0,
          lng: coords?.lng ?? 0,
          napuhanac: [b.selected_bounce_house ?? ""],
          bookingIds: [b.id],
          geocodeFailed: !coords,
        });
      }),
    );

    setGeocoding(false);
    const merged = mergeStopsByAddress(geocoded);
    setStops(merged);
    const failedCount = merged.filter((s) => s.geocodeFailed).length;
    if (failedCount > 0) setError(`${failedCount} adresa treba ručni pin — klikni "Pin na karti".`);
  };

  const removeStop = (i: number) => setStops((prev) => prev.filter((_, idx) => idx !== i));

  const handleSignOut = async () => {
    await signOut();
    navigate("/hop-upravljanje");
  };

  const resetTrip = () => {
    setTripGroups(null);
    setStops([]);
    setSelectedDate(null);
    setError("");
  };

  // kalendar je na desktopu uvijek vidljiv (lijevi stupac); dialog otvaramo samo ispod lg
  const openMobileCalendar = () => {
    if (window.matchMedia("(max-width: 1023px)").matches) setCalendarOpen(true);
  };

  // auto-odabir dana pri ucitavanju: danas ako ima rezervacija, inace prvi sljedeci dan s rezervacijom;
  // ako nema nijednog nadolazeceg -> odmah otvori kalendar (nema praznog ekrana bez konteksta)
  useEffect(() => {
    if (autoSelectedRef.current || isLoading || isError) return;
    autoSelectedRef.current = true;

    const todayKey = format(new Date(), "yyyy-MM-dd");
    const hasToday = shiftBookings.some((b) => b.booking_start_date === todayKey);
    const targetDate = hasToday
      ? todayKey
      : shiftBookings
          .map((b) => b.booking_start_date)
          .filter((d) => d >= todayKey)
          .sort()[0];

    if (targetDate) {
      setCurrentMonth(new Date(`${targetDate}T00:00:00`));
      handleSelectDate(targetDate, true);
    } else {
      openMobileCalendar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftBookings, isLoading, isError]);

  // auto-izracunaj rute cim su svi stopovi geocodani (bez rucnog "Izracunaj rutu" klika) -> ceka fix pina ako netko fail-a
  useEffect(() => {
    if (stops.length === 0 || stops.some((s) => s.geocodeFailed)) return;
    setTripGroups(groupIntoTrips(stops));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops]);

  return (
    <div className="min-h-screen bg-muted/30 p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
      <div className="mx-auto w-full max-w-md lg:max-w-7xl">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold">{t.title}</h1>
            <button
              onClick={openMobileCalendar}
              className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer lg:pointer-events-none"
            >
              {selectedDateObj ? (
                <span className="font-medium text-foreground capitalize underline decoration-dotted underline-offset-4 lg:no-underline">
                  {format(selectedDateObj, "EEEE, d. MMMM yyyy.", { locale: hr })}
                </span>
              ) : (
                t.brand
              )}
              <CalendarDays className="h-3.5 w-3.5 shrink-0 lg:hidden" />
            </button>
            {selectedDate && (
              <button
                onClick={() => {
                  resetTrip();
                  openMobileCalendar();
                }}
                className="mt-1 flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-3 w-3" /> Promijeni dan
              </button>
            )}
            {autoFallback && (
              <p className="text-xs text-muted-foreground">Nema rezervacija danas — prikazan prvi sljedeći dan s rezervacijom.</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {/* stalni prekidač smjene -> uvijek jasno u kojoj si i kako u drugu */}
            <div className="flex rounded-lg border bg-muted/40 p-0.5 text-xs font-medium">
              <Link
                to="/radnik/dostava"
                className={cn(
                  "rounded-md px-2.5 py-1 transition-colors",
                  mode === "delivery" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Dostava
              </Link>
              <Link
                to="/radnik/skupljanje"
                className={cn(
                  "rounded-md px-2.5 py-1 transition-colors",
                  mode === "pickup" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Skupljanje
              </Link>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Odjava" className="h-7 w-7">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="mt-6 lg:grid lg:grid-cols-[400px_1fr] lg:items-start lg:gap-6">
          <div className="space-y-6">
            {isError ? (
              <Card>
                <CardContent className="p-5 text-center space-y-2">
                  <p className="text-sm text-destructive font-medium">Rezervacije se nisu učitale.</p>
                  <Button variant="link" onClick={() => refetch()}>
                    Pokušaj ponovno
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="hidden lg:block">
                  <BookingCalendar
                    bookings={shiftBookings}
                    currentMonth={currentMonth}
                    onMonthChange={setCurrentMonth}
                    selectedDate={selectedDateObj}
                    onSelectDate={(date) => handleSelectDate(format(date, "yyyy-MM-dd"))}
                    isLoading={isLoading}
                    showLegend
                    isDaySelectable={(_dateKey, dayBookings) => dayBookings.length > 0}
                    products={bounceHouses}
                  />
                </div>

                <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <DialogContent className="max-w-sm p-0 lg:hidden">
                    <DialogHeader className="p-4 pb-0">
                      <DialogTitle>
                        {selectedDateObj
                          ? format(selectedDateObj, "d. MMMM yyyy.", { locale: hr })
                          : "Odaberi dan"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="p-4 pt-2">
                      <BookingCalendar
                        bookings={shiftBookings}
                        currentMonth={currentMonth}
                        onMonthChange={setCurrentMonth}
                        selectedDate={selectedDateObj}
                        onSelectDate={(date) => {
                          handleSelectDate(format(date, "yyyy-MM-dd"));
                          setCalendarOpen(false);
                        }}
                        isLoading={isLoading}
                        showLegend
                        isDaySelectable={(_dateKey, dayBookings) => dayBookings.length > 0}
                        products={bounceHouses}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {geocoding && <p className="text-sm text-primary font-medium text-center">Geocodiramo adrese...</p>}


            {!tripGroups && (
              <Card>
                <CardContent className="p-5 space-y-3">
                  {stops.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedDate ? t.noStops : "Odaberi dan u kalendaru."}
                    </p>
                  )}
                  {stops.length > 0 && <OverviewMap origin={WAREHOUSE} stops={stops} />}
                  {stops.map((s, i) => (
                    <div
                      key={i}
                      className={`flex items-stretch gap-0 text-sm border rounded-xl overflow-hidden ${s.geocodeFailed ? "border-orange-300 bg-orange-50/60 dark:bg-orange-950/20" : "bg-muted/40"}`}
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
                      <div className="flex flex-1 items-start gap-2 px-3 py-3">
                        <div className="flex-1 space-y-1.5">
                          <div className="font-medium">{s.name}</div>
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <PartyPopper className="h-3.5 w-3.5 shrink-0" />
                            <span>{s.napuhanac.join(", ")}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span>{s.address}</span>
                          </div>
                          {s.phone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span>{s.phone}</span>
                            </div>
                          )}
                          {s.geocodeFailed && (
                            <button
                              onClick={() => setPinTarget(i)}
                              className="flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:underline cursor-pointer"
                            >
                              <MapPinned className="h-3.5 w-3.5" />
                              Pin na karti
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => removeStop(i)}
                          aria-label="Ukloni dostavu"
                          className="shrink-0 p-1.5 -m-1.5 text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {stops.length > 0 && (
                    <p className="text-xs text-muted-foreground">{t.perTrip(MAX_PER_TRIP)}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          </div>

          <div className="mt-6 space-y-6 lg:mt-0">
            {tripGroups ? (
              <div className="space-y-6 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(380px,1fr))] lg:items-start lg:gap-6 lg:space-y-0">
                {tripGroups.map((group, i) => (
                  <TripCard
                    key={i}
                    index={i}
                    mode={mode}
                    origin={WAREHOUSE}
                    stops={group}
                    storageKey={`${mode}-${selectedDate}-${i}`}
                  />
                ))}
              </div>
            ) : (
              <Card className="hidden lg:block border-dashed">
                <CardContent className="p-10 text-center text-sm text-muted-foreground">
                  {t.emptyTrips}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {pinTarget !== null && (
        <LocationConfirmDialog
          open
          onOpenChange={(open) => !open && setPinTarget(null)}
          address={stops[pinTarget].address}
          lat={stops[pinTarget].lat || WAREHOUSE.lat}
          lng={stops[pinTarget].lng || WAREHOUSE.lng}
          onConfirm={(address, lat, lng) => {
            setStops((prev) =>
              prev.map((s, i) => (i === pinTarget ? { ...s, address, lat, lng, geocodeFailed: false } : s)),
            );
            setPinTarget(null);
          }}
        />
      )}
    </div>
  );
}
