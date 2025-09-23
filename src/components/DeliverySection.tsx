import { MapPin, Truck } from "lucide-react";

const DeliverySection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-6">
              <div className="bg-gradient-to-r from-primary to-accent p-3 rounded-full mr-4">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
                Dostavljamo u <span className="text-primary">Zagrebu</span> i okolici
              </h2>
            </div>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Naš tim brzo i sigurno dostavlja napuhance direktno na vašu lokaciju. 
              Pokrivamo cijeli Zagreb i okolna mjesta do 30km udaljenosti.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-center lg:justify-start">
                <MapPin className="h-5 w-5 text-primary mr-3" />
                <span className="text-lg">Besplatna dostava u Zagrebu</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start">
                <MapPin className="h-5 w-5 text-primary mr-3" />
                <span className="text-lg">Dostava u okolici 50kn</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start">
                <MapPin className="h-5 w-5 text-primary mr-3" />
                <span className="text-lg">Brza dostava u roku od 2 sata</span>
              </div>
            </div>
          </div>

          {/* Mascot Image */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl"></div>
              <img 
                src="/assets/mascot-delivery.png" 
                alt="Hop Hop mascot delivering bounce houses" 
                className="relative w-full max-w-md h-auto float-animation"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeliverySection;