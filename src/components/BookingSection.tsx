import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, Phone, User, Castle, CheckCircle, Loader2, MapPin, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { analytics } from "@/lib/analytics";
import { useState, useEffect, useRef } from "react";
import AddressField from "@/components/AddressField";
import { usePublishedBounceHouses } from "@/hooks/useBounceHouseOptions";
import { rawValuesForSlug } from "@/lib/bounceHouseCompat";
import LateNightUpsellDialog from "@/components/LateNightUpsellDialog";
import { LATE_PICKUP_PRICE, getNightImage } from "@/lib/lateNightPickup";

// Checks availability across every raw value a booking could hold for this product slug
// (the slug itself + legacy short names from before bookings stored slugs — see bounceHouseCompat.ts).
async function fetchUnavailableDates(slug: string, startDate: string, endDate: string): Promise<Set<string>> {
  const results = await Promise.all(
    rawValuesForSlug(slug).map((rawValue) =>
      supabase.rpc('check_availability_safe', {
        bounce_house_name: rawValue,
        check_start_date: startDate,
        check_end_date: endDate,
      })
    )
  );

  const dates = new Set<string>();
  for (const { data, error } of results) {
    if (error) {
      console.error('Error checking availability:', error);
      continue;
    }
    (data || []).forEach((r: { unavailable_date: string }) => dates.add(r.unavailable_date));
  }
  return dates;
}

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, "Ime mora imati najmanje 2 znakova").max(50, "Ime ne smije biti duže od 50 znakova"),
  surname: z.string().min(2, "Prezime mora imati najmanje 2 znakova").max(50, "Prezime ne smije biti duže od 50 znakova"),
  email: z.string().email("Unesite valjanu email adresu").max(255, "Email ne smije biti duži od 255 znakova"),
  phone: z.string().min(8, "Broj telefona mora imati najmanje 8 znamenki").max(20, "Broj telefona ne smije biti duži od 20 znamenki"),
  delivery_address: z.string().min(5, "Adresa mora biti duža od 5 znakova").max(255, "Adresa ne smije biti duža od 255 znakova"),
  booking_start_date: z.string().min(1, "Molimo odaberite datum"),
  selected_bounce_house: z.string().min(1, "Molimo odaberite napuhanac"),
  late_pickup: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const BookingSection = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<string>("");
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const { data: bounceHouses = [] } = usePublishedBounceHouses();

  // Late night pickup upsell: when the customer submits without ticking the
  // toggle (and the chosen inflatable has a night image), we intercept and show
  // the upsell interstitial. `upsellValues` holds the submission until the
  // customer either adds the add-on or declines.
  const [upsellValues, setUpsellValues] = useState<FormData | null>(null);

  const confirmedLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      phone: "",
      delivery_address: "",
      booking_start_date: "",
      selected_bounce_house: "",
      late_pickup: false,
    },
  });

  const selectedDate = form.watch("booking_start_date");
  const selectedBounceHouse = form.watch("selected_bounce_house");

  // Both date + house picked -> show whether that combo is free. No pre-filtering of the dropdown.
  useEffect(() => {
    if (!selectedDate || !selectedBounceHouse) {
      setAvailabilityStatus("");
      return;
    }

    setIsCheckingAvailability(true);
    let cancelled = false;
    fetchUnavailableDates(selectedBounceHouse, selectedDate, selectedDate).then((dates) => {
      if (cancelled) return;
      setAvailabilityStatus(
        dates.has(selectedDate)
          ? "❌ Ovaj napuhanac je već rezerviran za odabrani datum"
          : "✅ Dostupno za rezervaciju!"
      );
      setIsCheckingAvailability(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, selectedBounceHouse]);

  // Entry point from the form. If the customer hasn't opted into late pickup and
  // the chosen inflatable has a night image, show the upsell first; otherwise
  // (already opted in, or football which has no night image) submit directly.
  const onSubmit = (values: FormData) => {
    if (!values.late_pickup && getNightImage(values.selected_bounce_house)) {
      setUpsellValues(values);
      return;
    }
    submitBooking(values);
  };

  const handleUpsellAccept = () => {
    const values = upsellValues;
    setUpsellValues(null);
    if (!values) return;
    form.setValue("late_pickup", true);
    submitBooking({ ...values, late_pickup: true });
  };

  const handleUpsellDecline = () => {
    const values = upsellValues;
    setUpsellValues(null);
    if (!values) return;
    submitBooking({ ...values, late_pickup: false });
  };

  const submitBooking = async (values: FormData) => {
    setIsSubmitting(true);

    try {
      // Double-check availability before submitting
      const clashes = await fetchUnavailableDates(
        values.selected_bounce_house,
        values.booking_start_date,
        values.booking_start_date
      );

      if (clashes.has(values.booking_start_date)) {
        toast({
          title: "Napuhanac već rezerviran",
          description: "Ovaj napuhanac je već rezerviran za odabrani datum. Molimo odaberite drugi datum.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const { data: insertedBooking, error } = await supabase
        .rpc('create_public_booking', {
          p_name: values.name,
          p_surname: values.surname,
          p_email: values.email || null,
          p_phone: values.phone || null,
          p_delivery_address: values.delivery_address || null,
          p_booking_start_date: values.booking_start_date,
          p_selected_bounce_house: values.selected_bounce_house || null,
          p_additional_notes: values.additional_notes || null,
          p_add_table_set: values.add_table_set || false,
          p_multiple_days: values.multiple_days || false,
          p_lat: confirmedLocationRef.current?.lat ?? null,
          p_lng: confirmedLocationRef.current?.lng ?? null,
          p_late_pickup: values.late_pickup || false,
        });

      if (error) {
        throw error;
      }

      // DB/availability keep the slug; email + calendar want the human-readable product name
      const bounceHouseName =
        bounceHouses.find((b) => b.slug === values.selected_bounce_house)?.name || values.selected_bounce_house;

      // Send email notification
      try {
        const { error: emailError } = await supabase.functions.invoke('send-booking-email', {
          body: { ...values, selected_bounce_house: bounceHouseName }
        });

        if (emailError) {
          // Check if it's a rate limit error
          if (emailError.message?.includes('429') || emailError.message?.includes('rate')) {
            console.warn('Rate limit reached for email notifications');
          }
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't block the booking if email fails
      }

      // Sync to Google Calendar
      try {
        if (insertedBooking) {
          await supabase.functions.invoke('sync-google-calendar', {
            body: { ...insertedBooking, selected_bounce_house: bounceHouseName }
          });
        }
      } catch (calendarError) {
        console.error('Error syncing to calendar:', calendarError);
        // Don't block the booking if calendar sync fails
      }

      toast({
        title: "🎉 Rezervacija zaprimljena!",
        description: "Vaša rezervacija je uspješno zaprimljena. Javit ćemo vam se samo ukoliko budu potrebni dodatni detalji.",
        className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 max-w-md",
      });

      analytics.trackBookingSubmission(values.selected_bounce_house, values.booking_start_date);
      form.reset();
      confirmedLocationRef.current = null;
      setAvailabilityStatus("");
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast({
        title: "Greška pri slanju rezervacije",
        description: "Došlo je do greške. Molimo pokušajte ponovo ili nas nazovite direktno.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="rezervacija" className="py-20 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Rezerviraj <span className="text-primary">Napuhanac</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Jednostavna online rezervacija u samo nekoliko koraka
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Booking Form */}
          <motion.div
            className="lg:col-span-2 min-w-0"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Card className="shadow-card hover:shadow-playful transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Calendar className="h-6 w-6 text-primary mr-3" />
                  Online rezervacija
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Section 1: Personal Info */}
                    <motion.div variants={itemVariants}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Osobni podaci</h3>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ime</FormLabel>
                                <FormControl>
                                  <Input placeholder="Vaše ime" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="surname"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prezime</FormLabel>
                                <FormControl>
                                  <Input placeholder="Vaše prezime" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="vaš@email.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefon</FormLabel>
                                <FormControl>
                                  <Input placeholder="01/234-5678" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="delivery_address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                Lokacija dostave
                              </FormLabel>
                              <FormControl>
                                <AddressField
                                  placeholder="Počnite tipkati adresu..."
                                  value={field.value ?? ""}
                                  onBlur={field.onBlur}
                                  onValueChange={field.onChange}
                                  onLocationChange={(loc) => {
                                    confirmedLocationRef.current = loc;
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </motion.div>

                    {/* Section 2: Booking Details */}
                    <motion.div variants={itemVariants}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Castle className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Detalji rezervacije</h3>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                        <FormField
                          control={form.control}
                          name="selected_bounce_house"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Izbor napuhanca</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Odaberite napuhanac" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {bounceHouses.map((b) => (
                                    <SelectItem key={b.slug} value={b.slug}>
                                      {b.name} - {b.discountPrice || b.price}€
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="booking_start_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Datum rezervacije</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  min={new Date().toISOString().split('T')[0]}
                                />
                              </FormControl>
                              {availabilityStatus && (
                                <motion.p
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  className={`text-sm mt-2 font-semibold ${
                                    availabilityStatus.includes("✅") ? "text-green-600" : "text-red-600"
                                  }`}
                                >
                                  {isCheckingAvailability ? "Provjeravam dostupnost..." : availabilityStatus}
                                </motion.p>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Late night pickup upsell toggle */}
                        <FormField
                          control={form.control}
                          name="late_pickup"
                          render={({ field }) => (
                            <FormItem className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <FormLabel className="flex items-center gap-2 text-base font-semibold">
                                    <Moon className="h-4 w-4 text-primary" />
                                    Kasno noćno preuzimanje
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                                      +{LATE_PICKUP_PRICE} €
                                    </span>
                                  </FormLabel>
                                  <p className="text-sm text-muted-foreground">
                                    Po napuhanac dolazimo tek nakon 22:00.
                                  </p>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    aria-label="Kasno noćno preuzimanje"
                                  />
                                </FormControl>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </motion.div>

                    {/* Submit Button */}
                    <motion.div variants={itemVariants} className="space-y-3">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full gradient-primary hover:shadow-playful transition-all duration-300 text-lg py-6"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Šalje se...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-5 w-5" />
                            Rezerviraj sada
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Info & Mascot */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="shadow-card">
                <CardContent className="p-8 text-center">
                  <div className="mb-6">
                    <img src="/assets/rezervacije-2.webp" alt="Hop Hop mascot taking reservations" className="w-32 h-32 mx-auto object-contain mascot-hover" loading="lazy" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    Ili nas nazovite direktno!
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary mr-3" />
                      <span className="text-lg font-semibold">095 865 5213</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary mr-3" />
                      <span>Svakim danom od 8:00 - 20:00</span>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-6 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    Nazovite nas
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-6">
                <h4 className="font-bold text-lg text-foreground mb-3">
                  Savjeti za rezervaciju:
                </h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Rezervirajte 2-3 dana unaprijed</li>
                  <li>• Provjerite vremensku prognozu</li>
                  <li>• Pripremite ravnu površinu 6x6m</li>
                  <li>• Osigurajte pristup struji u blizini</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {upsellValues && getNightImage(upsellValues.selected_bounce_house) && (
        <LateNightUpsellDialog
          open={!!upsellValues}
          // Dismissing via overlay/Esc keeps the booking going without the add-on.
          onOpenChange={(open) => !open && handleUpsellDecline()}
          imageSrc={getNightImage(upsellValues.selected_bounce_house)!}
          bounceHouseName={upsellValues.selected_bounce_house}
          onAccept={handleUpsellAccept}
          onDecline={handleUpsellDecline}
        />
      )}
    </section>
  );
};

export default BookingSection;
