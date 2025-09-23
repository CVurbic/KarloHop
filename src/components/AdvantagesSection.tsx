import { Card, CardContent } from "@/components/ui/card";

const AdvantagesSection = () => {
  const advantages = [
    {
      title: "Besplatna dostava",
      description: "Dostavljamo napuhance besplatno u Zagrebu i okolici",
      image: "/assets/mascot-delivery.png",
      bgColor: "from-primary/10 to-primary/5"
    },
    {
      title: "Montaža uračunata u cijenu",
      description: "Naš tim postavlja i objašnjava sigurno korištenje",
      image: "/assets/mascot-setup.png",
      bgColor: "from-secondary/10 to-secondary/5"
    },
    {
      title: "Bez skrivenih troškova",
      description: "Transparentne cijene, plaćate točno ono što vidite",
      image: "/assets/mascot-chill.png",
      bgColor: "from-accent/10 to-accent/5"
    }
  ];

  return (
    <section id="advantages" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Zašto <span className="text-secondary">Hop Hop</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Mi smo tu da vašoj djeci omogućimo najbolju zabavu uz potpunu sigurnost
          </p>
        </div>

        {/* Advantages Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {advantages.map((advantage, index) => (
            <Card 
              key={index}
              className="text-center overflow-hidden shadow-card hover:shadow-playful transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20"
            >
              <CardContent className="p-8">
                <div className={`w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br ${advantage.bgColor} flex items-center justify-center`}>
                  <img 
                    src={advantage.image} 
                    alt={advantage.title} 
                    className="w-24 h-24 object-contain mascot-hover"
                  />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">
                  {advantage.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {advantage.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdvantagesSection;