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
  Plus,
  ClipboardPaste,
  Trash2,
  Pencil,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookingCalendar } from "@/components/BookingCalendar";
import { useAllBounceHouses } from "@/hooks/useBounceHouseOptions";
import { toBounceHouseSlug } from "@/lib/bounceHouseCompat";

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
  const { data: bounceHouses = [] } = useAllBounceHouses();
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

  const calendarBookings = useMemo(() => bookings.filter((b) => b.status !== "cancelled"), [bookings]);

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
        const created = await createBooking.mutateAsync(payload);
        toast.success("Rezervacija kreirana");

        // Sync to Google Calendar
        try {
          await supabase.functions.invoke("sync-google-calendar", {
            body: created,
          });
        } catch (calendarError) {
          console.error("Calendar sync error:", calendarError);
        }
      }

      setFormData(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
    } catch {
      toast.error("Greška pri spremanju rezervacije");
    }
  };

  const handlePaste = () => {
    const parsed = parseReservation(pasteText, bounceHouses);
    const nameParts = parsed.name.split(" ");
    const parsedPrice = parsed.price.replace(/[^\d.]/g, "");
    const bouncer = bounceHouses.find((b) => b.slug === parsed.bouncer);
    setFormData({
      name: nameParts[0] || "",
      surname: nameParts.slice(1).join(" ") || "",
      email: parsed.email,
      phone: parsed.phone,
      delivery_address: parsed.address,
      booking_start_date: parsed.date,
      selected_bounce_house: parsed.bouncer,
      price: parsedPrice || (bouncer ? bouncer.price : ""),
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
      // Resolves any legacy short-name value to today's slug so the select shows the right option
      // (and re-saving quietly upgrades that one booking's stored value — see bounceHouseCompat.ts).
      selected_bounce_house: toBounceHouseSlug(booking.selected_bounce_house) || "",
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

      <BookingCalendar
        bookings={calendarBookings}
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        isLoading={isLoading}
        products={bounceHouses}
      />

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
                  const bouncer = bounceHouses.find((b) => b.slug === toBounceHouseSlug(booking.selected_bounce_house));
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
                            <Badge
                              variant="secondary"
                              style={bouncer?.color ? { backgroundColor: bouncer.color, color: "#fff" } : undefined}
                            >
                              {bouncer?.name || booking.selected_bounce_house}
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
                  onValueChange={(v) => {
                    const bouncer = bounceHouses.find((b) => b.slug === v);
                    setFormData((prev) => ({
                      ...prev,
                      selected_bounce_house: v,
                      price: bouncer ? bouncer.price : prev.price,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberi" />
                  </SelectTrigger>
                  <SelectContent>
                    {bounceHouses.map((b) => (
                      <SelectItem key={b.slug} value={b.slug}>{b.name}</SelectItem>
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
