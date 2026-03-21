import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogCard from "@/components/BlogCard";
import { usePublishedPosts } from "@/hooks/useBlogPosts";

const SavjetiPage = () => {
  const { data: posts, isLoading } = usePublishedPosts();

  useEffect(() => {
    document.title =
      "Savjeti i ideje za dječje proslave | Hop Hop Napuhanci";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Pronađite korisne savjete, ideje i inspiraciju za organizaciju nezaboravnih dječjih rođendana i proslava. Hop Hop Napuhanci — Zagreb i okolica."
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 pt-24 pb-12 md:pt-32 md:pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Savjeti i ideje
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Korisni savjeti za organizaciju nezaboravnih dječjih proslava,
            rođendana i zabava na otvorenom.
          </p>
        </div>
      </section>

      {/* Posts grid */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          </div>
        ) : !posts?.length ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">
              Uskoro dolaze novi članci!
            </p>
            <Link
              to="/"
              className="text-primary hover:underline font-medium"
            >
              Povratak na početnu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary/10 to-accent/10 py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Planirate proslavu?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Pogledajte naše napuhance i rezervirajte termin za nezaboravnu
            dječju zabavu!
          </p>
          <Link
            to="/#napuhanci"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg gradient-primary text-white font-medium hover:shadow-playful transition-all duration-300"
          >
            Pogledaj napuhance
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SavjetiPage;
