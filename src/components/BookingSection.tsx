import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar, Clock, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, "Ime mora imati najmanje 2 znakova").max(50, "Ime ne smije biti duže od 50 znakova"),
  surname: z.string().min(2, "Prezime mora imati najmanje 2 znakova").max(50, "Prezime ne smije biti duže od 50 znakova"),
  email: z.string().email("Unesite valjanu email adresu").max(255, "Email ne smije biti duži od 255 znakova"),
  phone: z.string().min(8, "Broj telefona mora imati najmanje 8 znamenki").max(20, "Broj telefona ne smije biti duži od 20 znamenki"),
  delivery_address: z.string().min(5, "Adresa mora biti duža od 5 znakova").max(255, "Adresa ne smije biti duža od 255 znakova"),
  booking_start_date: z.string().min(1, "Molimo odaberite datum"),
  selected_bounce_house: z.string().min(1, "Molimo odaberite napuhanac"),
  multiple_days: z.boolean(),
  add_table_set: z.boolean(),
  additional_notes: z.string().max(500, "Napomene ne smiju biti duže od 500 znakova").optional(),
});

type FormData = z.infer<typeof formSchema>;

const BookingSection = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<string>("");
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  
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
      multiple_days: false,
      add_table_set: false,
      additional_notes: "",
    },
  });

  const selectedDate = form.watch("booking_start_date");
  const selectedBounceHouse = form.watch("selected_bounce_house");

  useEffect(() => {
    const checkAvailability = async () => {
      if (!selectedDate || !selectedBounceHouse) {
        setAvailabilityStatus("");
        return;
      }

      setIsCheckingAvailability(true);
      
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('booking_start_date', selectedDate)
          .eq('selected_bounce_house', selectedBounceHouse);

        if (error) throw error;

        if (data && data.length > 0) {
          setAvailabilityStatus("❌ Ovaj napuhanac je već rezerviran za odabrani datum");
        } else {
          setAvailabilityStatus("✅ Dostupno za rezervaciju!");
        }
      } catch (error) {
        console.error('Error checking availability:', error);
        setAvailabilityStatus("");
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, [selectedDate, selectedBounceHouse]);

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .insert([values]);

      if (error) {
        throw error;
      }

      // Send email notification
      try {
        await supabase.functions.invoke('send-booking-email', {
          body: values
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't block the booking if email fails
      }

      toast({
        title: "🎉 Rezervacija uspješno poslana!",
        description: "Vaša rezervacija je uspješno zabilježena. Kontaktirat ćemo Vas uskoro.",
        className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 max-w-md",
      });

      form.reset();
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
    <section id="booking" className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
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
                            <SelectItem value="jednorog">Jednorog svijet - 80€</SelectItem>
                            <SelectItem value="legoland">Legoland - 100€</SelectItem>
                            <SelectItem value="dino-park">Dino park - 75€</SelectItem>
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
                          <p className={`text-sm mt-2 font-semibold ${
                            availabilityStatus.includes("✅") ? "text-green-600" : "text-red-600"
                          }`}>
                            {isCheckingAvailability ? "Provjeravam dostupnost..." : availabilityStatus}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="multiple_days"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Trebam više dana
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Označite ako vam treba napuhanac za više od jednog dana
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="add_table_set"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border-2 border-primary/50 bg-primary/5 p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-base font-bold flex items-center">
                            ⭐ Dodaj set stola i klupa za samo 15€/dan
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-primary">Preporučujemo!</span> Savršeno za dodatno sjedenje na vašem događaju - 1 stol i 2 klupe
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

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
                    disabled={isSubmitting}
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
                  <img src="/assets/rezervacije-2.png" alt="Hop Hop mascot taking reservations" className="w-32 h-32 mx-auto object-contain mascot-hover" />
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
                <li>• Osigurajte pristup struji u blizini</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingSection;