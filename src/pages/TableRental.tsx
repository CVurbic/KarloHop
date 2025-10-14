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
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

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

  const handleNavigateToBooking = () => {
    // Store table rental data in sessionStorage to pre-fill the main booking form
    sessionStorage.setItem('tableRentalRequest', 'true');
    navigate('/#booking');
    
    // Small delay to ensure navigation completes before scrolling
    setTimeout(() => {
      const bookingSection = document.getElementById('booking');
      if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
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
              <div className="space-y-6">
                <div className="text-center p-8 bg-primary/5 rounded-lg border-2 border-primary/20">
                  <h3 className="text-2xl font-bold mb-4">Rezervirajte setove stolova</h3>
                  <p className="text-muted-foreground mb-6">
                    Kliknite na gumb ispod da rezervirate pivske stolove zajedno s napuhancem ili samostalno
                  </p>
                  <Button 
                    onClick={handleNavigateToBooking}
                    className="w-full max-w-md bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6"
                  >
                    Idi na rezervaciju
                  </Button>
                </div>

                <div className="bg-accent/10 border border-accent/20 rounded-xl p-6">
                  <h4 className="font-bold text-lg mb-3">Što ćete moći odabrati:</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>✓ Dodati set stolova uz napuhanac (+15€/dan)</li>
                    <li>✓ Odabrati napuhanac i setove</li>
                    <li>✓ Unijeti sve kontakt podatke</li>
                    <li>✓ Odabrati datum i adresu dostave</li>
                  </ul>
                </div>
              </div>
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
