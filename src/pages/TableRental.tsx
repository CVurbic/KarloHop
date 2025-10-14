import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { MapPin, Phone, Calendar, Package } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  name: z.string().min(2, "Ime mora imati najmanje 2 znakova").max(50, "Ime ne smije biti duže od 50 znakova"),
  surname: z.string().min(2, "Prezime mora imati najmanje 2 znakova").max(50, "Prezime ne smije biti duže od 50 znakova"),
  email: z.string().email("Unesite valjanu email adresu").max(255, "Email ne smije biti duži od 255 znakova"),
  phone: z.string().min(8, "Broj telefona mora imati najmanje 8 znamenki").max(20, "Broj telefona ne smije biti duži od 20 znamenki"),
  delivery_address: z.string().min(5, "Adresa mora biti duža od 5 znakova").max(255, "Adresa ne smije biti duža od 255 znakova"),
  rental_date: z.string().min(1, "Molimo odaberite datum"),
  number_of_sets: z.string().min(1, "Molimo unesite broj setova"),
  tables_only: z.boolean(),
  benches_only: z.boolean(),
  additional_notes: z.string().max(500, "Napomene ne smiju biti duže od 500 znakova").optional(),
});

type FormData = z.infer<typeof formSchema>;

const TableRental = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      phone: "",
      delivery_address: "",
      rental_date: "",
      number_of_sets: "1",
      tables_only: false,
      benches_only: false,
      additional_notes: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    
    try {
      const rentalDetails = {
        ...values,
        rental_type: values.tables_only ? "Samo stolovi" : values.benches_only ? "Samo klupe" : "Komplet set",
      };

      // Za sada možemo koristiti istu tablicu bookings sa posebnom oznakom
      const { error } = await supabase
        .from('bookings')
        .insert([{
          name: values.name,
          surname: values.surname,
          email: values.email,
          phone: values.phone,
          delivery_address: values.delivery_address,
          booking_start_date: values.rental_date,
          selected_bounce_house: `Najam stolova - ${rentalDetails.rental_type} - ${values.number_of_sets} set(ova)`,
          additional_notes: values.additional_notes || "",
        }]);

      if (error) throw error;

      toast({
        title: "🎉 Rezervacija stolova uspješno poslana!",
        description: "Kontaktirat ćemo vas uskoro za potvrdu.",
        className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 max-w-md",
      });

      form.reset();
    } catch (error) {
      console.error('Error submitting table rental:', error);
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
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Najam <span className="text-primary">Pivskih Stolova</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Pivski stolovi s klupama za sve prilike - rođendane, vrtne zabave, obiteljska okupljanja
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl"></div>
              <img 
                src="/assets/stolovi.png" 
                alt="Pivski stolovi s klupama" 
                className="relative w-full max-w-md mx-auto h-auto float-animation" 
              />
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center">
                    <Package className="h-6 w-6 text-primary mr-3" />
                    <div>
                      <h3 className="font-bold text-lg">Set sadrži</h3>
                      <p className="text-muted-foreground">1 stol i 2 klupe</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-6 w-6 text-primary mr-3" />
                    <div>
                      <h3 className="font-bold text-lg">Dimenzije stola</h3>
                      <p className="text-muted-foreground">200 x 70 x 75 cm</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-6 w-6 text-primary mr-3" />
                    <div>
                      <h3 className="font-bold text-lg">Cijena</h3>
                      <p className="text-2xl font-bold text-primary">15€/dan po setu</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-accent/10 border border-accent/20 rounded-xl p-6">
                <h4 className="font-bold text-lg mb-3">Mogućnosti najma:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✓ Kompletni setovi (stol + 2 klupe)</li>
                  <li>✓ Samo stolovi</li>
                  <li>✓ Samo klupe</li>
                  <li>✓ Dostava i postavljanje uključeno</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Form Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Calendar className="h-6 w-6 text-primary mr-3" />
                Rezervacija Stolova
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                        <FormLabel>Adresa dostave</FormLabel>
                        <FormControl>
                          <Input placeholder="Ulica i broj, Zagreb" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="rental_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Datum najma</FormLabel>
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
                      name="number_of_sets"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Broj setova</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              placeholder="1" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="tables_only"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) form.setValue("benches_only", false);
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Samo stolovi</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Trebam samo stolove bez klupa
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="benches_only"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) form.setValue("tables_only", false);
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Samo klupe</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Trebam samo klupe bez stolova
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="additional_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dodatne napomene</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Posebni zahtjevi ili pitanja..." 
                            rows={3} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6"
                  >
                    {isSubmitting ? "Šalje se..." : "Pošalji rezervaciju"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="mt-8 shadow-card">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Imate pitanja?
              </h3>
              <div className="flex items-center justify-center mb-4">
                <Phone className="h-5 w-5 text-primary mr-3" />
                <span className="text-lg font-semibold">095 865 5213</span>
              </div>
              <p className="text-muted-foreground">
                Svakim danom od 8:00 - 20:00
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TableRental;
