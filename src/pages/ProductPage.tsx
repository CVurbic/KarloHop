import { useParams, Link, Navigate, useLocation } from "react-router-dom";
import { napuhanci } from "@/data/products";
import { ArrowLeft, Ruler, Baby, CheckCircle, Phone, Clock, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import BookingSection from "@/components/BookingSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useEffect } from "react";

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const product = napuhanci.find((p) => p.slug === slug);

  useEffect(() => {
    if (location.hash === "#rezervacija") {
      setTimeout(() => {
        document.getElementById("rezervacija")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [slug, location.hash]);

  if (!product) {
    return <Navigate to="/" replace />;
  }

  const otherProducts = napuhanci.filter((p) => p.slug !== slug);

  return (
    <>
      {/* SEO meta tags via useEffect */}
      <MetaTags product={product} />

      <div className="min-h-screen overflow-x-hidden">
        {/* Navigation */}
        <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center">
                <img
                  src="/assets/logo.webp"
                  alt="Hop Hop Napuhanci Logo"
                  className="h-12 w-auto mascot-hover"
                />
              </Link>
              <Link
                to="/"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Natrag na početnu</span>
                <span className="sm:hidden">Početna</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative glass-blue overflow-hidden">
          <div className="container mx-auto px-4 py-12 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="text-center lg:text-left order-2 lg:order-1">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-4 leading-tight">
                  {product.name}{" "}
                  <span className="text-primary">napuhanac</span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground mb-6 leading-relaxed">
                  {product.longDesc}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    size="lg"
                    className="bg-warning text-warning-foreground hover:bg-warning/90 shadow-playful hover:shadow-mascot transition-all duration-300 text-lg px-8 py-6 rounded-full"
                    onClick={() =>
                      document
                        .getElementById("rezervacija")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Rezerviraj ovaj napuhanac
                  </Button>
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <span className="text-3xl font-bold text-primary">
                      {product.price}€
                    </span>
                    <span className="text-muted-foreground">/dan</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center order-1 lg:order-2">
                <img
                  src={product.coverImage}
                  alt={`${product.name} napuhanac`}
                  className="w-full max-w-md lg:max-w-lg xl:max-w-xl h-auto rounded-2xl shadow-lg"
                />
              </div>
            </div>
          </div>
          {/* Bottom Wave */}
          <div className="absolute bottom-0 left-0 w-full">
            <svg
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              className="relative block w-full h-16 fill-background"
            >
              <path d="M0,60 C300,100 600,20 1200,60 L1200,120 L0,120 Z" />
            </svg>
          </div>
        </section>

        {/* Product Details */}
        <section className="py-16 lg:py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Detalji <span className="text-primary">proizvoda</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <Card className="text-center shadow-card hover:shadow-playful transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="bg-primary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                    <Ruler className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-sm text-muted-foreground mb-1">
                    Dimenzije
                  </CardTitle>
                  <p className="font-bold text-foreground text-lg">
                    {product.dimensions}
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center shadow-card hover:shadow-playful transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="bg-primary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                    <Baby className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-sm text-muted-foreground mb-1">
                    Uzrast
                  </CardTitle>
                  <p className="font-bold text-foreground text-lg">
                    {product.ages}
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center shadow-card hover:shadow-playful transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="bg-warning/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-7 w-7 text-warning" />
                  </div>
                  <CardTitle className="text-sm text-muted-foreground mb-1">
                    Trajanje najma
                  </CardTitle>
                  <p className="font-bold text-foreground text-lg">
                    8 sati / dan
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center shadow-card hover:shadow-playful transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="bg-accent/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                    <Truck className="h-7 w-7 text-accent" />
                  </div>
                  <CardTitle className="text-sm text-muted-foreground mb-1">
                    Dostava
                  </CardTitle>
                  <p className="font-bold text-foreground text-lg">
                    Besplatno do 10km
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* What's included */}
            <div className="max-w-2xl mx-auto mt-12">
              <h3 className="text-2xl font-bold text-foreground text-center mb-6">
                Što je uključeno u najam?
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {product.included.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-accent/5 border border-accent/10 rounded-xl p-4"
                  >
                    <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="py-16 lg:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Galerija <span className="text-primary">slika</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {product.gallery.map((src, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl overflow-hidden shadow-card hover:shadow-playful transition-all duration-300 hover:-translate-y-1"
                >
                  <img
                    src={src}
                    alt={`${product.name} - slika ${i + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking Section — same as landing page */}
        <BookingSection />

        {/* Other Products */}
        <section className="py-16 lg:py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Pogledaj i ostale{" "}
              <span className="text-primary">napuhance</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {otherProducts.map((p) => (
                <Link
                  key={p.id}
                  to={`/${p.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden shadow-card hover:shadow-playful transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20">
                    <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 aspect-square">
                      <img
                        src={p.coverImage}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <CardContent className="p-6">
                      <CardTitle className="text-xl mb-2 text-foreground">
                        {p.name}
                      </CardTitle>
                      <p className="text-muted-foreground mb-3">
                        {p.shortDesc}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-primary">
                          {p.price}€
                          <span className="text-sm text-muted-foreground">
                            /dan
                          </span>
                        </div>
                        <span className="text-primary font-medium group-hover:underline">
                          Saznaj više →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-12 bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Imate pitanja?
            </h3>
            <p className="text-muted-foreground mb-6">
              Slobodno nas nazovite — rado ćemo pomoći!
            </p>
            <a
              href="tel:+385958655213"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-lg font-semibold"
            >
              <Phone className="h-5 w-5" />
              095 865 5213
            </a>
          </div>
        </section>

        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
};

/** Sets document head meta tags for SEO */
function MetaTags({ product }: { product: (typeof napuhanci)[number] }) {
  useEffect(() => {
    document.title = product.seo.title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", product.seo.description);
    setMeta("property", "og:title", product.seo.title);
    setMeta("property", "og:description", product.seo.description);
    setMeta("property", "og:image", `https://hophop-napuhanci.com${product.seo.ogImage}`);
    setMeta("property", "og:url", `https://hophop-napuhanci.com/${product.slug}`);
    setMeta("name", "twitter:title", product.seo.title);
    setMeta("name", "twitter:description", product.seo.description);
    setMeta("name", "twitter:image", `https://hophop-napuhanci.com${product.seo.ogImage}`);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.href = `https://hophop-napuhanci.com/${product.slug}`;
  }, [product]);

  return null;
}

export default ProductPage;
