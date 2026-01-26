import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ContactSection = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Molimo unesite sve podatke",
        description: "Sva polja su obavezna.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Send email notification
      await supabase.functions.invoke('send-contact-email', {
        body: formData
      });

      toast({
        title: "Poruka uspješno poslana!",
        description: "Vaša poruka je uspješno poslana. Odgovorit ćemo vam uskoro.",
      });

      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      console.error('Error sending contact email:', error);
      toast({
        title: "Greška pri slanju poruke",
        description: "Došlo je do greške. Molimo pokušajte ponovo ili nas nazovite direktno.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <section id="kontakt" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Kontaktirajte <span className="text-secondary">Hop Hop</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Nazovite ili pošaljite upit! Tu smo da odgovorimo na sva vaša pitanja!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="shadow-card hover:shadow-playful transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Mail className="h-6 w-6 text-primary mr-3" />
                Pošaljite nam poruku
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="contact-ime">Ime</Label>
                    <Input 
                      id="contact-ime" 
                      name="name"
                      placeholder="Vaše ime" 
                      value={formData.name}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact-email">Email</Label>
                    <Input 
                      id="contact-email" 
                      name="email"
                      type="email" 
                      placeholder="vaš@email.com" 
                      value={formData.email}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact-poruka">Poruka</Label>
                    <Textarea 
                      id="contact-poruka" 
                      name="message"
                      placeholder="Vaše pitanje ili poruka..." 
                      rows={5} 
                      value={formData.message}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full gradient-secondary hover:shadow-playful transition-all duration-300 text-lg py-6"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Šalje se..." : "Pošaljite poruku"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-8">
            {/* Contact Details */}
            <Card className="shadow-card">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-foreground mb-6">
                  Informacije za kontakt
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-primary/10 p-3 rounded-full mr-4">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Telefon</h4>
                      <p className="text-muted-foreground">095 865 5213</p>
                      <p className="text-sm text-muted-foreground">Brz odgovor i rezervacija</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-secondary/10 p-3 rounded-full mr-4">
                      <Mail className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Email</h4>
                      <p className="text-muted-foreground">info@hophop-napuhanci.com</p>
                      <p className="text-sm text-muted-foreground">Za detaljne upite</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-accent/10 p-3 rounded-full mr-4">
                      <MapPin className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Adresa</h4>
                      <p className="text-muted-foreground">Lanište 26, Zagreb</p>
                      <p className="text-sm text-muted-foreground">Dostava do 30km</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-warning/10 p-3 rounded-full mr-4">
                      <Clock className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Radno vrijeme</h4>
                      <p className="text-muted-foreground">Pon - Pet: 8:00 - 20:00</p>
                      <p className="text-muted-foreground">Sub - Ned: 9:00 - 18:00</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA Card */}
            <Card className="gradient-fun text-white shadow-mascot">
              <CardContent className="p-8 text-center">
                <img src="/assets/mascot-jumping.png" alt="Hop Hop mascot" className="w-24 h-24 mx-auto mb-4 object-contain" loading="lazy" />
                <h3 className="text-2xl font-bold mb-3">
                  Spremni za zabavu?
                </h3>
                <p className="mb-6 opacity-90">
                  Kontaktirajte nas danas i rezervirajte svoj napuhanac!
                </p>
                <Button variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  Rezerviraj sada
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Google Maps */}
        <div className="mt-12">
          <Card className="shadow-card overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <MapPin className="h-6 w-6 text-primary mr-3" />
                Pronađite nas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2782.5!2d15.9!3d45.78!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4765d6f5a3d25d75%3A0x1234567890abcdef!2sLani%C5%A1te%2026%2C%2010020%2C%20Zagreb%2C%20Croatia!5e0!3m2!1sen!2shr!4v1700000000000!5m2!1sen!2shr"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Hop Hop Napuhanci lokacija - Lanište 26, Zagreb"
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;