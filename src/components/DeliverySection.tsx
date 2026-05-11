import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOBILE_VISIBLE_COUNT = 12;

const freeDeliveryAreas = [
  "Novi Zagreb",
  "Lanište",
  "Blato",
  "Remetinec",
  "Kajzerica",
  "Siget",
  "Sopot",
  "Središće",
  "Utrina",
  "Travno",
  "Zapruđe",
  "Dugave",
  "Sveta Klara",
  "Botinec",
  "Odra",
  "Buzin",
  "Veliko Polje",
  "Hrvatski Leskovac",
  "Lučko",
  "Demerje",
  "Stupnik",
  "Rakitje",
  "Kerestinec",
  "Sveta Nedelja",
  "Brezovica",
  "Jarun",
  "Knežija",
  "Srednjaci",
  "Vrbani",
  "Prečko",
  "Špansko",
  "Malešnica",
  "Stenjevec",
  "Vrapče",
  "Črnomerec",
  "Podsused",
  "Trešnjevka",
  "Trnje",
  "Kruge",
  "Savica",
  "Centar (Donji Grad)",
  "Maksimir",
  "Peščenica",
  "Dubrava",
];

const paidDeliveryAreas = [
  "Velika Gorica",
  "Samobor",
  "Zaprešić",
  "Sesvete",
  "Ostala mjesta izvan 15 km",
];

const DeliverySection = () => {
  const [showAllFreeAreas, setShowAllFreeAreas] = useState(false);
  const hiddenFreeCount = freeDeliveryAreas.length - MOBILE_VISIBLE_COUNT;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
                Dostavljamo u <span className="text-primary">Zagrebu</span> i okolici
              </h2>
            </div>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Naš tim brzo i sigurno dostavlja napuhance direktno na vašu lokaciju. Nudimo besplatnu dostavu unutar 15 km od Arene Zagreb, a za sve lokacije izvan tog radijusa dostava se naplaćuje 40€. Osobno preuzimanje je moguće u našoj garaži na adresi Lanište 26.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start justify-center lg:justify-start text-left">
                <MapPin className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                <span className="text-lg">Montaža uračunata u cijenu</span>
              </div>
              <div className="flex items-start justify-center lg:justify-start text-left">
                <MapPin className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                <span className="text-lg">Besplatna dostava do 15 km od Arene Zagreb</span>
              </div>
              <div className="flex items-start justify-center lg:justify-start text-left">
                <MapPin className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                <span className="text-lg">Izvan 15 km — dostava 40€</span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-3 text-center lg:text-left">
                Besplatna dostava pokriva:
              </h3>
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {freeDeliveryAreas.map((area, index) => (
                  <span
                    key={area}
                    className={`inline-block bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full ${
                      index >= MOBILE_VISIBLE_COUNT && !showAllFreeAreas
                        ? "hidden lg:inline-block"
                        : ""
                    }`}
                  >
                    {area}
                  </span>
                ))}
              </div>
              {hiddenFreeCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllFreeAreas((v) => !v)}
                  className="lg:hidden mt-3 text-sm font-semibold text-primary underline-offset-4 hover:underline mx-auto block"
                  aria-expanded={showAllFreeAreas}
                >
                  {showAllFreeAreas ? "Sakrij" : `Prikaži sve (+${hiddenFreeCount})`}
                </button>
              )}
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-3 text-center lg:text-left">
                Dostava 40€:
              </h3>
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {paidDeliveryAreas.map((area) => (
                  <span
                    key={area}
                    className="inline-block bg-muted text-muted-foreground text-sm font-medium px-3 py-1 rounded-full"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-center lg:justify-start">
              <a href="#rezervacija">
                <Button className="gradient-primary hover:shadow-playful transition-all duration-300 text-white font-semibold py-4 px-8 rounded-lg text-lg hover:-translate-y-1">
                  Rezerviraj napuhanac
                </Button>
              </a>
            </div>
          </div>

          {/* Mascot Image */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl pointer-events-none"></div>
              <img
                src="/assets/mascot-delivery.webp"
                alt="Hop Hop mascot delivering bounce houses"
                className="relative w-full max-w-md h-auto float-animation"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeliverySection;
