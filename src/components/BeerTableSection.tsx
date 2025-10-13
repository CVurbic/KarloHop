import { MapPin } from "lucide-react";
const BeerTableSection = () => {
  return <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Content */}
        <div className="text-center lg:text-left lg:order-2">
          <div className="flex items-center justify-center lg:justify-start mb-6">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
              Najam <span className="text-primary">stolova i klupa</span>
            </h2>
          </div>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Pivski stolovi s klupama osiguravaju dovoljno prostora za sve goste. Bilo da planirate vrtne zabave, rođendane ili obiteljska okupljanja, naši stolovi i klupe pružaju praktično i stabilno rješenje.
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
                <span className="text-lg">Samo 15€/dan po setu</span>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center lg:justify-start">
              <a href="/najam-stolova">
                <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-md font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  Rezerviraj Stolove
                </button>
              </a>
            </div>
          </div>

        {/* Image */}
        <div className="flex justify-center lg:order-1">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl"></div>
            <img src="/assets/stolovi.png" alt="Hop Hop beer tables with benches" className="relative w-full max-w-md h-auto float-animation" />
          </div>
        </div>
      </div>
    </div>
    </section>;
};
export default BeerTableSection;