import { Card, CardContent } from "@/components/ui/card";
const AdvantagesSection = () => {
  const advantages = [{
    title: "Besplatna dostava",
    description: "Dostavljamo napuhance besplatno do 10km udaljenosti",
    image: "/assets/mascot-delivery.png",
    bgColor: "from-primary/10 to-primary/5"
  }, {
    title: "Loše vrijeme bez naknada",
    description: "Nema novčanih naknada kada otkažemo zbog lošeg vremena",
    image: "/assets/nevrijeme.png",
    bgColor: "from-secondary/10 to-secondary/5"
  }, {
    title: "Bez avansne uplate",
    description: "Plaćate tek kad napuhanac stigne na vašu lokaciju",
    image: "/assets/mascot-chill.png",
    bgColor: "from-accent/10 to-accent/5"
  }];
  return <section id="prednosti" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Zašto <span className="text-red-500">Hop Hop Napuhanci</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Naši napuhanci donose vrhunsku zabavu te osmijehe na lica mališana. Birajte vesele tobogane i dvorce na napuhavanje za svoju proslavu.</p>
        </div>

        {/* Advantages Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {advantages.map((advantage, index) => <Card key={index} className="text-center overflow-hidden shadow-card hover:shadow-playful transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20">
              <CardContent className="p-8">
                <div className={`w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br ${advantage.bgColor} flex items-center justify-center`}>
                  <img src={advantage.image} alt={advantage.title} className="w-24 h-24 object-contain mascot-hover" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">
                  {advantage.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {advantage.description}
                </p>
              </CardContent>
            </Card>)}
        </div>

        {/* Booking Button */}
        <div className="text-center mt-16">
          <a href="#rezervacija" className="inline-block">
            <button className="gradient-primary hover:shadow-playful transition-all duration-300 text-white font-semibold py-4 px-8 rounded-lg text-lg hover:-translate-y-1">
              Rezerviraj napuhanac
            </button>
          </a>
        </div>
      </div>
    </section>;
};
export default AdvantagesSection;