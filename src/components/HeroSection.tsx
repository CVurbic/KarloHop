import { Button } from "@/components/ui/button";
import { Star, Sparkles, Truck, Shield, Clock } from "lucide-react";

const HeroSection = () => {
  return (
    <section id="pocetna" className="relative min-h-screen flex items-center glass-blue overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 text-warning opacity-80">
          <Star className="h-8 w-8 float-animation" style={{ animationDelay: '0s' }} />
        </div>
        <div className="absolute top-40 right-20 text-orange opacity-80">
          <Sparkles className="h-6 w-6 float-animation" style={{ animationDelay: '1s' }} />
        </div>
        <div className="absolute bottom-40 left-20 text-accent opacity-80">
          <Star className="h-10 w-10 float-animation" style={{ animationDelay: '2s' }} />
        </div>
        <div className="absolute top-60 left-1/3 text-warning opacity-60">
          <Sparkles className="h-4 w-4 float-animation" style={{ animationDelay: '0.5s' }} />
        </div>
        <div className="absolute bottom-60 right-1/3 text-orange opacity-60">
          <Star className="h-6 w-6 float-animation" style={{ animationDelay: '1.5s' }} />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10 bg-transparent">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left text-white">
            <h1 className="text-4xl font-bold mb-4 leading-tight text-foreground lg:text-6xl">
              Najam napuhanaca u <span className="text-primary">Zagrebu</span> i okolici
            </h1>
            
            {/* Horizontal bullets */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-6 mb-8">
              <div className="flex items-center gap-2 text-foreground">
                <Truck className="h-5 w-5 text-primary" />
                <span className="font-medium">Dostava + montaža</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-medium">Sigurnosna oprema</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-medium">Rezervacija u 1 minuti</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-warning text-warning-foreground hover:bg-warning/90 shadow-playful hover:shadow-mascot transition-all duration-300 text-lg px-8 py-6 rounded-full"
                onClick={() => document.getElementById('rezervacija')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Rezerviraj svoj napuhanac
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-warning hover:bg-white hover:text-primary backdrop-blur-sm text-lg px-8 py-6 rounded-full"
                onClick={() => document.getElementById('napuhanci')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Pogledaj ponudu
              </Button>
            </div>
          </div>

          {/* Mascot Image */}
          <div className="flex justify-center lg:justify-end">
            <img 
              src="/assets/mascot-jumping-new.png" 
              alt="Hop Hop Mascot jumping with kids on bounce house" 
              className="w-full max-w-md lg:max-w-lg xl:max-w-xl h-auto hop-bounce" 
            />
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-16 fill-background">
          <path d="M0,60 C300,100 600,20 1200,60 L1200,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
