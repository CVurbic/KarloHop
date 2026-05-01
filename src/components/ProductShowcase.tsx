import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { napuhanci } from "@/data/products";
import { usePublishedProducts } from "@/hooks/useProducts";
import ProductSticker from "@/components/ProductSticker";

const ProductShowcase = () => {
  const { data: dbProducts } = usePublishedProducts();

  // Use DB products if available, otherwise fall back to static
  const products = dbProducts
    ? dbProducts.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        coverImage: p.cover_image || "",
        shortDesc: p.short_desc || "",
        dimensions: p.dimensions || "",
        price: p.price,
        discountPrice: p.discount_price,
        discountLabel: p.discount_label,
        stickerText: p.sticker_text,
        stickerColor: p.sticker_color,
      }))
    : napuhanci.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        coverImage: p.coverImage,
        shortDesc: p.shortDesc,
        dimensions: p.dimensions,
        price: p.price,
        discountPrice: null as string | null,
        discountLabel: null as string | null,
        stickerText: null as string | null,
        stickerColor: null as string | null,
      }));

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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {products.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden shadow-card hover:shadow-playful transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20"
            >
              <CardHeader className="p-0">
                <Link to={`/${product.slug}`}>
                  <div
                    className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 aspect-square cursor-pointer group"
                  >
                    <img
                      src={product.coverImage}
                      alt={product.name}
                      className="w-full h-full object-cover mascot-hover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    {product.stickerText && (
                      <ProductSticker
                        text={product.stickerText}
                        color={product.stickerColor}
                        className="absolute top-3 right-3 h-16 w-16 text-xs z-10"
                      />
                    )}
                  </div>
                </Link>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="text-xl mb-2 text-foreground">{product.name}</CardTitle>
                <p className="text-muted-foreground mb-2">{product.shortDesc}</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Dimenzije: {product.dimensions}
                </p>
                <p className="text-xs text-muted-foreground/70 mb-4">
                  *Cijena se odnosi na osobno preuzimanje po dogovoru ili dostavu do 10km
                  udaljenosti
                </p>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl font-bold text-primary">
                    {product.discountPrice ? (
                      <>
                        <span className="text-base line-through text-muted-foreground font-normal">
                          {product.price}€
                        </span>{" "}
                        {product.discountPrice}€
                        {product.discountLabel && (
                          <span className="ml-2 text-xs bg-warning text-warning-foreground px-2 py-0.5 rounded-full font-bold">
                            {product.discountLabel}
                          </span>
                        )}
                      </>
                    ) : (
                      <>{product.price}€</>
                    )}
                    <span className="text-sm text-muted-foreground">/dan</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link
                    to={`/${product.slug}#rezervacija`}
                    className="flex-1 inline-flex items-center justify-center rounded-full text-sm font-bold h-11 px-4 py-2 bg-warning text-warning-foreground hover:bg-warning/90 shadow-playful hover:shadow-mascot transition-all duration-300"
                  >
                    Rezerviraj
                  </Link>
                  <Link
                    to={`/${product.slug}`}
                    className="inline-flex items-center justify-center rounded-full text-sm font-medium h-11 px-4 py-2 border-2 border-primary/20 text-primary hover:bg-primary/5 transition-all duration-300"
                  >
                    Saznaj više
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Načini plaćanja - visible on all screens */}
        <div className="mt-12 px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">Načini plaćanja</h2>
          <img
            src="/assets/nacini-placanja.png"
            alt="Načini plaćanja - Visa, Mastercard, Google Pay, Apple Pay, gotovina"
            className="w-full max-w-3xl mx-auto"
          />
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
