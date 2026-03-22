import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ClipboardPaste,
  Trash2,
  Pencil,
  Eye,
} from "lucide-react";
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
import {
  useAllBookings,
  useCreateBooking,
  useUpdateBooking,
  useDeleteBooking,
  useBookingsRealtime,
  type Booking,
} from "@/hooks/useBookings";
import { parseReservation } from "@/lib/parseReservation";
import { toast } from "sonner";

const BOUNCERS = [
  { name: "Minecraft Party", color: "bg-blue-500", lightColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", dotColor: "bg-blue-400" },
  { name: "Dino Park", color: "bg-teal-500", lightColor: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300", dotColor: "bg-teal-400" },
  { name: "Jednorog", color: "bg-pink-500", lightColor: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300", dotColor: "bg-pink-400" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Na čekanju" },
  { value: "confirmed", label: "Potvrđeno" },
  { value: "cancelled", label: "Otkazano" },
  { value: "completed", label: "Završeno" },
];

const EMPTY_FORM = {
  name: "",
  surname: "",
  email: "",
  phone: "",
  delivery_address: "",
  booking_start_date: "",
  selected_bounce_house: "",
  price: "100",
  status: "confirmed",
  additional_notes: "",
};

const BookingManager = () => {
  useBookingsRealtime();

  const { data: bookings = [], isLoading } = useAllBookings();
  const createBooking = useCreateBooking();
  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);

  // Calendar data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = (getDay(monthStart) + 6) % 7; // Monday = 0

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      if (b.status === "cancelled") return;
      const dateKey = b.booking_start_date.split("T")[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(b);
    });
    return map;
  }, [bookings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        surname: formData.surname,
        email: formData.email || null,
        phone: formData.phone || null,
        delivery_address: formData.delivery_address || null,
        booking_start_date: formData.booking_start_date,
        booking_end_date: null,
        selected_bounce_house: formData.selected_bounce_house || null,
        additional_notes: formData.additional_notes || null,
        add_table_set: null,
        multiple_days: null,
        status: formData.status,
        price: formData.price ? Number(formData.price) : null,
      };

      if (editingId) {
        await updateBooking.mutateAsync({ id: editingId, ...payload });
        toast.success("Rezervacija ažurirana");
      } else {
        await createBooking.mutateAsync(payload);
        toast.success("Rezervacija kreirana");
      }

      setFormData(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
    } catch {
      toast.error("Greška pri spremanju rezervacije");
    }
  };

  const handlePaste = () => {
    const parsed = parseReservation(pasteText);
    const nameParts = parsed.name.split(" ");
    setFormData({
      name: nameParts[0] || "",
      surname: nameParts.slice(1).join(" ") || "",
      email: parsed.email,
      phone: parsed.phone,
      delivery_address: parsed.address,
      booking_start_date: parsed.date,
      selected_bounce_house: parsed.bouncer,
      price: parsed.price.replace(/[^\d.]/g, ""),
      status: "confirmed",
      additional_notes: "",
    });
    setShowPaste(false);
    setPasteText("");
    setShowForm(true);
  };

  const handleEdit = (booking: Booking) => {
    setFormData({
      name: booking.name,
      surname: booking.surname,
      email: booking.email || "",
      phone: booking.phone || "",
      delivery_address: booking.delivery_address || "",
      booking_start_date: booking.booking_start_date.split("T")[0],
      selected_bounce_house: booking.selected_bounce_house || "",
      price: booking.price != null ? String(booking.price) : "",
      status: booking.status,
      additional_notes: booking.additional_notes || "",
    });
    setEditingId(booking.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Jeste li sigurni da želite obrisati ovu rezervaciju?")) return;
    try {
      await deleteBooking.mutateAsync(id);
      toast.success("Rezervacija obrisana");
    } catch {
      toast.error("Greška pri brisanju");
    }
  };

  const dayNames = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

  const selectedDateBookings = selectedDate
    ? bookingsByDate[format(selectedDate, "yyyy-MM-dd")] || []
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rezervacije</h1>
          <p className="text-muted-foreground text-sm mt-1">Upravljanje rezervacijama napuhanaca</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showPaste} onOpenChange={setShowPaste}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <ClipboardPaste className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Zalijepi tekst</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Zalijepi tekst rezervacije</DialogTitle>
              </DialogHeader>
              <Textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={"Ime: Ivan\nPrezime: Horvat\nEmail: ivan@email.com\nTelefon: 091...\nNapuhanac: Minecraft Party\nDatum: 2026-04-15\nAdresa: Zagreb\nCijena: 150"}
                rows={10}
              />
              <Button onClick={handlePaste} disabled={!pasteText.trim()}>
                Parsiraj i popuni formu
              </Button>
            </DialogContent>
          </Dialog>
          <Button
            size="sm"
            onClick={() => {
              setFormData(EMPTY_FORM);
              setEditingId(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nova rezervacija</span>
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 sm:gap-4">
        {BOUNCERS.map((b) => (
          <div key={b.name} className="flex items-center gap-1.5 text-xs sm:text-sm">
            <div className={`h-3 w-3 rounded-full ${b.dotColor}`} />
            {b.name}
          </div>
        ))}
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-lg capitalize">
            {format(currentMonth, "LLLL yyyy", { locale: hr })}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
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
              {dayNames.map((d) => (
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

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDate(day)}
                    className={`relative p-1 sm:p-2 min-h-[44px] sm:min-h-[60px] rounded-lg text-left transition-colors ${
                      !isSameMonth(day, currentMonth)
                        ? "text-muted-foreground/40"
                        : isSelected
                        ? "bg-primary/10 ring-2 ring-primary"
                        : isToday
                        ? "bg-yellow-50 dark:bg-yellow-900/20"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <span className={`text-xs ${isToday ? "font-bold text-primary" : ""}`}>
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

      {/* Selected date bookings */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Rezervacije za {format(selectedDate, "d. MMMM yyyy.", { locale: hr })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nema rezervacija za ovaj datum.</p>
            ) : (
              <div className="space-y-3">
                {selectedDateBookings.map((booking) => {
                  const bouncer = BOUNCERS.find((b) => b.name === booking.selected_bounce_house);
                  return (
                    <div
                      key={booking.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm">
                            {booking.name} {booking.surname}
                          </span>
                          {booking.selected_bounce_house && (
                            <Badge variant="secondary" className={bouncer?.lightColor || ""}>
                              {booking.selected_bounce_house}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {booking.phone && <span className="mr-3">{booking.phone}</span>}
                          {booking.delivery_address && <span>{booking.delivery_address}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {booking.price != null && (
                          <span className="text-sm font-medium mr-2">{Number(booking.price).toFixed(2)} €</span>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => setViewBooking(booking)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(booking)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(booking.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View booking dialog */}
      <Dialog open={!!viewBooking} onOpenChange={() => setViewBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalji rezervacije</DialogTitle>
          </DialogHeader>
          {viewBooking && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Ime:</span> {viewBooking.name} {viewBooking.surname}</div>
                <div><span className="text-muted-foreground">Email:</span> {viewBooking.email || "-"}</div>
                <div><span className="text-muted-foreground">Telefon:</span> {viewBooking.phone || "-"}</div>
                <div><span className="text-muted-foreground">Adresa:</span> {viewBooking.delivery_address || "-"}</div>
                <div><span className="text-muted-foreground">Napuhanac:</span> {viewBooking.selected_bounce_house || "-"}</div>
                <div><span className="text-muted-foreground">Datum:</span> {format(new Date(viewBooking.booking_start_date), "d. MMMM yyyy.", { locale: hr })}</div>
                <div><span className="text-muted-foreground">Cijena:</span> {viewBooking.price != null ? `${Number(viewBooking.price).toFixed(2)} €` : "-"}</div>
                <div><span className="text-muted-foreground">Status:</span> {STATUS_OPTIONS.find(s => s.value === viewBooking.status)?.label || viewBooking.status}</div>
              </div>
              {viewBooking.additional_notes && (
                <div><span className="text-muted-foreground">Napomene:</span> {viewBooking.additional_notes}</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking form dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Uredi rezervaciju" : "Nova rezervacija"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ime</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Prezime</Label>
                <Input
                  required
                  value={formData.surname}
                  onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>Adresa dostave</Label>
                <Input
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                />
              </div>
              <div>
                <Label>Datum</Label>
                <Input
                  type="date"
                  required
                  value={formData.booking_start_date}
                  onChange={(e) => setFormData({ ...formData, booking_start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Napuhanac</Label>
                <Select
                  value={formData.selected_bounce_house}
                  onValueChange={(v) => setFormData({ ...formData, selected_bounce_house: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberi" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOUNCERS.map((b) => (
                      <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cijena (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Napomene</Label>
                <Textarea
                  value={formData.additional_notes}
                  onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Odustani
              </Button>
              <Button type="submit" disabled={createBooking.isPending || updateBooking.isPending}>
                {editingId ? "Spremi promjene" : "Kreiraj rezervaciju"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingManager;
