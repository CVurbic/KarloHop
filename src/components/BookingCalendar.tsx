import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { hr } from "date-fns/locale";
import type { Booking } from "@/hooks/useBookings";
import type { BounceHouseOption } from "@/hooks/useBounceHouseOptions";
import { toBounceHouseSlug } from "@/lib/bounceHouseCompat";

const DAY_NAMES = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const;

export function BookingCalendar({
  bookings,
  currentMonth,
  onMonthChange,
  selectedDate,
  onSelectDate,
  showLegend = true,
  isLoading = false,
  isDaySelectable,
  unavailableDates,
  products,
}: {
  bookings: Booking[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  showLegend?: boolean;
  isLoading?: boolean;
  isDaySelectable?: (dateKey: string, dayBookings: Booking[]) => boolean;
  /** Public availability mode: dates in this set are booked/unavailable, past days are locked, rest shown as available. */
  unavailableDates?: Set<string>;
  /** Resolves each booking's stored bounce-house value to a name/color for the legend + day dots. */
  products?: BounceHouseOption[];
}) {
  const findProduct = (rawValue: string | null) =>
    products?.find((p) => p.slug === toBounceHouseSlug(rawValue));
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = (getDay(monthStart) + 6) % 7; // Pon = 0

  const shouldReduceMotion = useReducedMotion();
  // Tracks which way we're navigating so the month swap slides the right direction.
  const directionRef = useRef(0);
  const [direction, setDirection] = useState(0);

  const goToMonth = (date: Date, dir: -1 | 1) => {
    directionRef.current = dir;
    setDirection(dir);
    onMonthChange(date);
  };

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      const dateKey = b.booking_start_date.split("T")[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(b);
    });
    return map;
  }, [bookings]);

  return (
    <div className="space-y-4">
      {showLegend && products && (
        <div className="flex flex-wrap gap-2">
          {products.map((p) => (
            <div
              key={p.slug}
              className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 text-xs sm:text-sm"
            >
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color || undefined }} />
              {p.name}
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="transition-transform active:scale-90"
            onClick={() => goToMonth(subMonths(currentMonth, 1), -1)}
            aria-label="Prethodni mjesec"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={format(currentMonth, "yyyy-MM")}
                custom={direction}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * -16 }}
                transition={{ duration: 0.22, ease: EASE_OUT_STRONG }}
              >
                <CardTitle className="text-lg capitalize">
                  {format(currentMonth, "LLLL yyyy", { locale: hr })}
                </CardTitle>
              </motion.div>
            </AnimatePresence>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="transition-transform active:scale-90"
            onClick={() => goToMonth(addMonths(currentMonth, 1), 1)}
            aria-label="Sljedeći mjesec"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={format(currentMonth, "yyyy-MM")}
                custom={direction}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * -24 }}
                transition={{ duration: 0.24, ease: EASE_OUT_STRONG }}
                className="grid grid-cols-7 gap-1"
              >
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-1 sm:py-2">
                    {d}
                  </div>
                ))}
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map((day, i) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const dayBookings = bookingsByDate[dateKey] || [];
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  const isPast = isBefore(day, startOfDay(new Date()));
                  const isUnavailable = unavailableDates?.has(dateKey) ?? false;
                  const selectable = unavailableDates
                    ? !isUnavailable && !isPast
                    : isDaySelectable
                      ? isDaySelectable(dateKey, dayBookings)
                      : true;

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => selectable && onSelectDate(day)}
                      disabled={!selectable}
                      title={unavailableDates && !isPast ? (isUnavailable ? "Zauzeto" : "Dostupno") : undefined}
                      aria-current={isToday ? "date" : undefined}
                      aria-pressed={isSelected ? true : undefined}
                      style={{ animationDelay: shouldReduceMotion ? undefined : `${Math.min(i, 20) * 12}ms` }}
                      className={`day-cell-in relative flex flex-col items-center justify-center gap-0.5 p-1 sm:p-2 min-h-[44px] sm:min-h-[64px] rounded-lg border text-center transition-all duration-200 disabled:cursor-not-allowed cursor-pointer ${!isSameMonth(day, currentMonth)
                        ? "border-transparent text-muted-foreground/40 cursor-default"
                        : isSelected
                          ? "gradient-primary text-primary-foreground border-transparent shadow-playful"
                          : unavailableDates && isUnavailable
                            ? "bg-destructive/15 text-destructive border-destructive/40 line-through shadow-sm"
                            : unavailableDates && !isPast
                              ? "bg-success/10 border-success/30 hover:bg-success/20 shadow-sm hover:shadow-md active:scale-95"
                              : selectable
                                ? "border-border bg-card shadow-sm hover:bg-muted/50 hover:shadow-md active:scale-95"
                                : "border-transparent opacity-40"
                        } ${isToday && !isSelected ? "ring-2 ring-warning/60 ring-offset-1 ring-offset-background" : ""}`}
                    >
                      <span className={`relative text-sm sm:text-base leading-none ${isSelected ? "font-bold" : dayBookings.length > 0 ? "font-bold text-primary" : "font-semibold"}`}>
                        {format(day, "d")}
                      </span>
                      {unavailableDates && !isPast && (
                        <span
                          className={`hidden sm:flex items-center gap-1 text-[9px] leading-tight ${isSelected ? "text-primary-foreground/90" : isUnavailable ? "text-destructive" : "text-success"
                            }`}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5" />}
                          {isSelected ? "odabrano" : isUnavailable ? "zauzeto" : "slobodno"}
                        </span>
                      )}
                      {dayBookings.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-0.5">
                          {dayBookings.map((b) => {
                            const product = findProduct(b.selected_bounce_house);
                            return (
                              <div
                                key={b.id}
                                className="h-2 w-2 rounded-full bg-muted-foreground"
                                style={product?.color ? { backgroundColor: product.color } : undefined}
                                title={`${b.name} ${b.surname} - ${product?.name || b.selected_bounce_house}`}
                              />
                            );
                          })}
                        </div>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
