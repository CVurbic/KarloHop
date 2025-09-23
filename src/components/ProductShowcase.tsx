import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProductShowcase = () => {
  const products = [
    {
      id: 1,
      name: "Dvorac Avantura",
      price: "150",
      image: "/assets/mascot-chill.png", // Using mascot as placeholder
      description: "Veliki napuhanac s toboganom i preprekama"
    },
    {
      id: 2,
      name: "Morska Pustolovština",
      price: "120",
      image: "/assets/mascot-setup.png", // Using mascot as placeholder
      description: "Vodeni napuhanac za vruce dane"
    },
    {
      id: 3,
      name: "Sportski Centar",
      price: "180",
      image: "/assets/mascot-delivery.png", // Using mascot as placeholder
      description: "Kombinacija skakanja i sporta"
    }
  ];

  return (
    <section id="products" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Naši <span className="text-primary">Napuhanci</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Biramo kvalitetne i sigurne napuhance za nezaboravnu zabavu vaše djece
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {products.map((product) => (
            <Card 
              key={product.id} 
              className="overflow-hidden shadow-card hover:shadow-playful transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20"
            >
              <CardHeader className="p-0">
                <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 p-8">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-48 object-contain mascot-hover"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="text-xl mb-2 text-foreground">
                  {product.name}
                </CardTitle>
                <p className="text-muted-foreground mb-4">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary">
                    {product.price}kn<span className="text-sm text-muted-foreground">/dan</span>
                  </div>
                  <Button 
                    variant="default"
                    className="gradient-secondary hover:shadow-playful transition-all duration-300"
                  >
                    Rezerviraj
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Special Offer */}
        <div className="text-center">
          <div className="inline-block gradient-fun text-white p-6 rounded-2xl shadow-mascot">
            <h3 className="text-2xl font-bold mb-2">
              Posebna ponuda: 3 dana za cijenu 2
            </h3>
            <p className="text-lg opacity-90">
              Treći dan gratis!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;