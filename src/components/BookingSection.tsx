import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar, Clock, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback, useRef } from "react";
import { debounce } from "lodash";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, "Ime mora imati najmanje 2 znakova").max(50, "Ime ne smije biti duže od 50 znakova"),
  surname: z.string().min(2, "Prezime mora imati najmanje 2 znakova").max(50, "Prezime ne smije biti duže od 50 znakova"),
  email: z.string().email("Unesite valjanu email adresu").max(255, "Email ne smije biti duži od 255 znakova"),
  phone: z.string().min(8, "Broj telefona mora imati najmanje 8 znamenki").max(20, "Broj telefona ne smije biti duži od 20 znamenki"),
  delivery_address: z.string().min(5, "Adresa mora biti duža od 5 znakova").max(255, "Adresa ne smije biti duža od 255 znakova"),
  booking_start_date: z.string().min(1, "Molimo odaberite početni datum"),
  booking_end_date: z.string().min(1, "Molimo odaberite završni datum"),
  selected_bounce_house: z.string().min(1, "Molimo odaberite napuhanac"),
  additional_notes: z.string().max(500, "Napomene ne smiju biti duže od 500 znakova").optional(),
}).refine((data) => {
  if (data.booking_start_date && data.booking_end_date) {
    return new Date(data.booking_start_date) <= new Date(data.booking_end_date);
  }
  return true;
}, {
  message: "Završni datum mora biti nakon početnog datuma",
  path: ["booking_end_date"],
});

type FormData = z.infer<typeof formSchema>;

const BookingSection = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availability, setAvailability] = useState<{[key: string]: string[]}>({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      phone: "",
      delivery_address: "",
      booking_start_date: "",
      booking_end_date: "",
      selected_bounce_house: "",
      additional_notes: "",
    },
  });

  const checkAvailability = useCallback(async (bounceHouse: string, startDate: string, endDate: string) => {
    if (!bounceHouse || !startDate || !endDate) return;
    
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    setIsCheckingAvailability(true);
    try {
      const { data, error } = await supabase.rpc('check_bounce_house_availability', {
        bounce_house_name: bounceHouse,
        check_start_date: startDate,
        check_end_date: endDate
      });

      if (error) throw error;

      const unavailableDates = data?.map((item: any) => item.unavailable_date) || [];
      setAvailability(prev => ({
        ...prev,
        [bounceHouse]: unavailableDates
      }));
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error checking availability:', error);
      }
    } finally {
      setIsCheckingAvailability(false);
    }
  }, []);

  // Debounced version to prevent too many API calls
  const debouncedCheckAvailability = useCallback(
    debounce(checkAvailability, 500),
    [checkAvailability]
  );

  const watchedValues = form.watch(['selected_bounce_house', 'booking_start_date', 'booking_end_date']);

  useEffect(() => {
    const [bounceHouse, startDate, endDate] = watchedValues;
    if (bounceHouse && startDate && endDate) {
      debouncedCheckAvailability(bounceHouse, startDate, endDate);
    } else {
      // Clear availability if any field is empty
      setAvailability({});
      setIsCheckingAvailability(false);
    }
    
    // Cleanup function to cancel debounced call
    return () => {
      debouncedCheckAvailability.cancel();
    };
  }, [watchedValues, debouncedCheckAvailability]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      debouncedCheckAvailability.cancel();
    };
  }, [debouncedCheckAvailability]);

  const onSubmit = async (values: FormData) => {
    // Check if dates are available before submitting
    const bounceHouse = values.selected_bounce_house;
    const unavailableDates = availability[bounceHouse] || [];
    
    if (unavailableDates.length > 0) {
      toast({
        title: "Napuhanac nije dostupan",
        description: `Odabrani napuhanac nije dostupan za datume: ${unavailableDates.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .insert([values]);

      if (error) {
        throw error;
      }

      toast({
        title: "Rezervacija uspješno poslana!",
        description: "Vaša rezervacija je uspješno zabilježena. Kontaktirat ćemo Vas uskoro.",
      });

      form.reset();
      setAvailability({});
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
  return <section id="booking" className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Rezerviraj <span className="text-primary">Napuhanac</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Jednostavna online rezervacija u samo nekoliko koraka
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Booking Form */}
          <Card className="shadow-card hover:shadow-playful transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Calendar className="h-6 w-6 text-primary mr-3" />
                Online rezervacija
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <FormLabel>Lokacija dostave</FormLabel>
                        <FormControl>
                          <Input placeholder="Adresa za dostavu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="selected_bounce_house"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Izbor napuhanca</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Odaberite napuhanac" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="princeza">Princeza dvorac - 110€</SelectItem>
                            <SelectItem value="legoland">Legoland - 120€</SelectItem>
                            <SelectItem value="dzungla">Mala džungla - 100€</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="booking_start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Početni datum</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="booking_end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Završni datum</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              min={form.watch('booking_start_date') || new Date().toISOString().split('T')[0]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Availability Status */}
                  {form.watch('selected_bounce_house') && form.watch('booking_start_date') && form.watch('booking_end_date') && (
                    <div className="p-4 rounded-lg border">
                      {isCheckingAvailability ? (
                        <div className="flex items-center text-muted-foreground">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          Provjeravam dostupnost...
                        </div>
                      ) : (
                        <div>
                          {availability[form.watch('selected_bounce_house')]?.length > 0 ? (
                            <div className="text-destructive">
                              <p className="font-medium mb-2">⚠️ Napuhanac nije dostupan za sljedeće datume:</p>
                              <ul className="list-disc list-inside text-sm">
                                {availability[form.watch('selected_bounce_house')].map((date: string) => (
                                  <li key={date}>{new Date(date).toLocaleDateString('hr-HR')}</li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="text-green-600">
                              <p className="font-medium">✅ Napuhanac je dostupan za odabrane datume!</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="additional_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dodatne napomene</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Posebni zahtjevi ili pitanja..." rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={isSubmitting || isCheckingAvailability || (form.watch('selected_bounce_house') && availability[form.watch('selected_bounce_house')]?.length > 0)}
                    className="w-full gradient-primary hover:shadow-playful transition-all duration-300 text-lg py-6"
                  >
                    {isSubmitting ? "Šalje se..." : "Pošaljite rezervaciju"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Contact Info & Mascot */}
          <div className="space-y-8">
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <img src="/assets/mascot-chill.png" alt="Hop Hop mascot relaxing" className="w-32 h-32 mx-auto object-contain mascot-hover" />
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

            <div className="bg-warning/10 border border-warning/20 rounded-xl p-6">
              <h4 className="font-bold text-lg text-foreground mb-3">
                Savjeti za rezervaciju:
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Rezervirajte 2-3 dana unaprijed</li>
                <li>• Provjerite vremensku prognozu</li>
                <li>• Pripremite ravnu površinu 6x6m</li>
                <li>• Osigurajte pristup struju u blizini</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default BookingSection;