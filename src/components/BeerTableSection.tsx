import { MapPin } from "lucide-react";

const BeerTableSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Mascot Image */}
          <div className="flex justify-center lg:order-1">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl"></div>
              <img 
                src="/assets/stolovi.png" 
                alt="Hop Hop mascot with beer tables" 
                className="relative w-full max-w-md h-auto float-animation" 
              />
            </div>
          </div>

          {/* Content */}
          <div className="text-center lg:text-left lg:order-2">
            <div className="flex items-center justify-center lg:justify-start mb-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
                Najam <span className="text-primary">pivskih stolova</span>
              </h2>
            </div>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Naši kvalitetni pivski stolovi s klupama osiguravaju udobno sjedenje za sve goste. Bilo da planirate vrtne zabave, rođendane ili obiteljska okupljanja, naši stolovi i klupe pružaju praktično i stabilno rješenje. Savršeni su i za veće proslave na otvorenom, a jednostavno postavljanje i čvrsta konstrukcija čine ih najboljim izborom za svaku priliku.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-center lg:justify-start">
                <MapPin className="h-5 w-5 text-primary mr-3" />
                <span className="text-lg">Set: 1 stol i 2 klupe</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start">
                <MapPin className="h-5 w-5 text-primary mr-3" />
                <span className="text-lg">Stol: 200 x 70 x 75 cm</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start">
                <MapPin className="h-5 w-5 text-primary mr-3" />
                <span className="text-lg">Klupa: 200 x 25 x 45 cm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BeerTableSection;