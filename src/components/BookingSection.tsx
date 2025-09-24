import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Phone } from "lucide-react";
const BookingSection = () => {
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
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ime">Ime</Label>
                  <Input id="ime" placeholder="Vaše ime" />
                </div>
                <div>
                  <Label htmlFor="prezime">Prezime</Label>
                  <Input id="prezime" placeholder="Vaše prezime" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="vaš@email.com" />
                </div>
                <div>
                  <Label htmlFor="telefon">Telefon</Label>
                  <Input id="telefon" placeholder="01/234-5678" />
                </div>
              </div>

              <div>
                <Label htmlFor="lokacija">Lokacija dostave</Label>
                <Input id="lokacija" placeholder="Adresa za dostavu" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="datum">Datum</Label>
                  <Input id="datum" type="date" />
                </div>
                <div>
                  <Label htmlFor="napuhanac">Izbor napuhanca</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite napuhanac" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="princeza">Princeza dvorac - 110kn</SelectItem>
                      <SelectItem value="legoland">Legoland - 120kn</SelectItem>
                      <SelectItem value="dzungla">Mala džungla - 100kn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="poruka">Dodatne napomene</Label>
                <Textarea id="poruka" placeholder="Posebni zahtjevi ili pitanja..." rows={3} />
              </div>

              <Button className="w-full gradient-primary hover:shadow-playful transition-all duration-300 text-lg py-6">
                Pošaljite rezervaciju
              </Button>
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