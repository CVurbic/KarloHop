import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProductShowcase = () => {
  const products = [{
    id: 1,
    name: "Jednorog svijet",
    price: "100",
    image: "/assets/jednorog-new.webp",
    description: "Napuhanac s jednorozima za male princeze",
    dimensions: "5.5 x 4.5 x 4.5m"
  }, {
    id: 2,
    name: "Minecraft party",
    price: "100",
    image: "/assets/minecraft-new.webp",
    description: "Minecraft avantura u napuhancu s toboganom",
    dimensions: "5.5 x 4.5 x 4.5m"
  }, {
    id: 3,
    name: "Dino park",
    price: "100",
    image: "/assets/dino-new.webp",
    description: "Zabava u Dinosaur napuhancu za male istraživače",
    dimensions: "5.5 x 4 x 4.5m"
  }];

  return (
    <section id="napuhanci" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Naši <span className="text-primary">Napuhanci</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Najam napuhanaca za dječje rođendane i proslave. Sigurni, kvalitetni i zabavni dvorci, tobogani i avanture na napuhavanje za nezaboravnu igru i osmijehe.
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {products.map(product => (
            <Card key={product.id} className="overflow-hidden shadow-card hover:shadow-playful transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20">
              <CardHeader className="p-0">
                <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 aspect-square">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover mascot-hover"
                    loading="lazy"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="text-xl mb-2 text-foreground">
                  {product.name}
                </CardTitle>
                <p className="text-muted-foreground mb-2">
                  {product.description}
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  Dimenzije: {product.dimensions}
                </p>
                <p className="text-xs text-muted-foreground/70 mb-4">
                  *Cijena se odnosi na osobno preuzimanje po dogovoru ili dostavu do 10km udaljenosti
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary">
                    100€<span className="text-sm text-muted-foreground">/dan</span>
                  </div>
                  <Button
                    variant="default"
                    className="gradient-secondary hover:shadow-playful transition-all duration-300"
                    onClick={() => document.getElementById('rezervacija')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Rezerviraj
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ProductShowcase;
