import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { hr } from "date-fns/locale";
import type { Booking } from "@/hooks/useBookings";

export const BOUNCERS = [
  { name: "Minecraft Party", color: "bg-blue-500", lightColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", dotColor: "bg-blue-400", price: "100" },
  { name: "Dino Park", color: "bg-teal-500", lightColor: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300", dotColor: "bg-teal-400", price: "100" },
  { name: "Jednorog", color: "bg-pink-500", lightColor: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300", dotColor: "bg-pink-400", price: "100" },
  { name: "Paw Patrol", color: "bg-yellow-500", lightColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300", dotColor: "bg-yellow-400", price: "100" },
  { name: "Super Mario", color: "bg-red-500", lightColor: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300", dotColor: "bg-red-400", price: "150" },
];

const DAY_NAMES = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

export function BookingCalendar({
  bookings,
  currentMonth,
  onMonthChange,
  selectedDate,
  onSelectDate,
  showLegend = true,
  isLoading = false,
  isDaySelectable,
}: {
  bookings: Booking[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  showLegend?: boolean;
  isLoading?: boolean;
  isDaySelectable?: (dateKey: string, dayBookings: Booking[]) => boolean;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = (getDay(monthStart) + 6) % 7; // Pon = 0

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
      {showLegend && (
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {BOUNCERS.map((b) => (
            <div key={b.name} className="flex items-center gap-1.5 text-xs sm:text-sm">
              <div className={`h-3 w-3 rounded-full ${b.dotColor}`} />
              {b.name}
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Button variant="ghost" size="icon" onClick={() => onMonthChange(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-lg capitalize">
            {format(currentMonth, "LLLL yyyy", { locale: hr })}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => onMonthChange(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-1 sm:py-2">
                  {d}
                </div>
              ))}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {days.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayBookings = bookingsByDate[dateKey] || [];
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const selectable = isDaySelectable ? isDaySelectable(dateKey, dayBookings) : true;

                return (
                  <button
                    key={dateKey}
                    onClick={() => selectable && onSelectDate(day)}
                    disabled={!selectable}
                    className={`relative p-1 sm:p-2 min-h-[44px] sm:min-h-[60px] rounded-lg text-left transition-colors ${
                      !isSameMonth(day, currentMonth)
                        ? "text-muted-foreground/40"
                        : isSelected
                        ? "bg-primary/10 ring-2 ring-primary"
                        : isToday
                        ? "bg-yellow-50 dark:bg-yellow-900/20"
                        : selectable
                        ? "hover:bg-muted/50"
                        : "opacity-40 cursor-default"
                    }`}
                  >
                    <span className={`text-xs ${isToday || dayBookings.length > 0 ? "font-bold text-primary" : ""}`}>
                      {format(day, "d")}
                    </span>
                    {dayBookings.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {dayBookings.map((b) => {
                          const bouncer = BOUNCERS.find((bn) => bn.name === b.selected_bounce_house);
                          return (
                            <div
                              key={b.id}
                              className={`h-2 w-2 rounded-full ${bouncer?.dotColor || "bg-muted-foreground"}`}
                              title={`${b.name} ${b.surname} - ${b.selected_bounce_house}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
