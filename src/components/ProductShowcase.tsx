import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { X } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const products = [
  {
    id: 1,
    name: "Jednorog svijet",
    price: "100",
    image: "/assets/jednorog-new.webp",
    gallery: [
      "/assets/jednorog-new.webp",
      "/assets/uni-product.webp",
      "/assets/unicorn-1.webp",
      "/assets/unicorn-2.webp",
      "/assets/unicorn-3.webp",
      "/assets/unicorn-4.webp",
    ],
    description: "Napuhanac s jednorozima za male princeze",
    dimensions: "5.5 x 4.5 x 4.5m",
  },
  {
    id: 2,
    name: "Minecraft party",
    price: "100",
    image: "/assets/minecraft-new.webp",
    gallery: [
      "/assets/minecraft-new.webp",
      "/assets/mcp-product.webp",
      "/assets/minecraft-1.webp",
      "/assets/minecraft-2.webp",
      "/assets/minecraft-3.webp",
      "/assets/minecraft-4.webp",
    ],
    description: "Minecraft avantura u napuhancu s toboganom",
    dimensions: "5.5 x 4.5 x 4.5m",
  },
  {
    id: 3,
    name: "Dino park",
    price: "100",
    image: "/assets/dino-product-main.webp",
    gallery: [
      "/assets/dino-product-main.webp",
      "/assets/dino-product.webp",
      "/assets/dino-1.webp",
      "/assets/dino-2.webp",
      "/assets/dino-3.webp",
      "/assets/dino-4.webp",
    ],
    description: "Zabava u Dinosaur napuhancu za male istraživače",
    dimensions: "5.5 x 4 x 4.5m",
  },
];

const ProductShowcase = () => {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  const activeProduct = lightbox !== null ? products.find((p) => p.id === lightbox) : null;

  const onSelect = useCallback(() => {
    if (!carouselApi) return;
    setCurrentSlide(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;
    onSelect();
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi, onSelect]);

  const openLightbox = (productId: number) => {
    setCurrentSlide(0);
    setLightbox(productId);
  };

  const closeLightbox = () => {
    setLightbox(null);
    setCarouselApi(undefined);
    setCurrentSlide(0);
  };

  return (
    <section id="napuhanci" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Naši <span className="text-primary">Napuhanci</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Najam napuhanaca za dječje rođendane i proslave. Sigurni, kvalitetni i zabavni dvorci,
            tobogani i avanture na napuhavanje za nezaboravnu igru i osmijehe.
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
                <div
                  className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 aspect-square cursor-pointer group"
                  onClick={() => openLightbox(product.id)}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover mascot-hover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 text-foreground text-sm font-medium px-4 py-2 rounded-full shadow">
                      Pogledaj galeriju
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="text-xl mb-2 text-foreground">{product.name}</CardTitle>
                <p className="text-muted-foreground mb-2">{product.description}</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Dimenzije: {product.dimensions}
                </p>
                <p className="text-xs text-muted-foreground/70 mb-4">
                  *Cijena se odnosi na osobno preuzimanje po dogovoru ili dostavu do 10km
                  udaljenosti
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary">
                    100€<span className="text-sm text-muted-foreground">/dan</span>
                  </div>
                  <Button
                    variant="default"
                    className="gradient-secondary hover:shadow-playful transition-all duration-300"
                    onClick={() =>
                      document
                        .getElementById("rezervacija")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Rezerviraj
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Kako rezervirati - hidden on mobile */}
        <div className="mt-12 px-4 hidden md:block">
          <img
            src="/assets/kako-rezervirati.webp"
            alt="Kako rezervirati napuhanac u 4 koraka"
            className="w-full max-w-4xl mx-auto rounded-2xl shadow-lg"
          />
        </div>
      </div>

      {/* Lightbox / Gallery Modal */}
      <Dialog open={lightbox !== null} onOpenChange={(open) => !open && closeLightbox()}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-4xl p-0 border-none bg-black/95 overflow-hidden [&>button:last-child]:hidden">
          <VisuallyHidden>
            <DialogTitle>{activeProduct?.name ?? "Galerija"}</DialogTitle>
          </VisuallyHidden>

          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute right-3 top-3 z-50 rounded-full bg-white/10 hover:bg-white/20 p-2 text-white transition-colors"
            aria-label="Zatvori"
          >
            <X className="h-5 w-5" />
          </button>

          {activeProduct && (
            <div className="relative px-4 sm:px-12 py-8">
              {/* Product name */}
              <p className="text-white/80 text-center text-lg font-semibold mb-4">
                {activeProduct.name}
              </p>

              <Carousel
                opts={{ loop: true }}
                setApi={setCarouselApi}
                className="w-full"
              >
                <CarouselContent>
                  {activeProduct.gallery.map((src, idx) => (
                    <CarouselItem key={idx}>
                      <div className="flex items-center justify-center">
                        <img
                          src={src}
                          alt={`${activeProduct.name} - slika ${idx + 1}`}
                          className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-0 sm:left-1 h-10 w-10 bg-white/10 hover:bg-white/20 border-none text-white" />
                <CarouselNext className="right-0 sm:right-1 h-10 w-10 bg-white/10 hover:bg-white/20 border-none text-white" />
              </Carousel>

              {/* Thumbnail strip */}
              <div className="flex justify-center gap-2 mt-4 overflow-x-auto pb-2">
                {activeProduct.gallery.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => carouselApi?.scrollTo(idx)}
                    className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentSlide
                        ? "border-primary opacity-100"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ProductShowcase;
