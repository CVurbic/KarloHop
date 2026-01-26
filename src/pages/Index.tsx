import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ProductShowcase from "@/components/ProductShowcase";
import ReviewsSection from "@/components/ReviewsSection";
import AdvantagesSection from "@/components/AdvantagesSection";
import DeliverySection from "@/components/DeliverySection";
import BeerTableSection from "@/components/BeerTableSection";
import BookingSection from "@/components/BookingSection";
import FAQSection from "@/components/FAQSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import PromoBanner from "@/components/PromoBanner";
import WhatsAppButton from "@/components/WhatsAppButton";

const Index = () => {
  return (
    <div className="min-h-screen">
      <PromoBanner />
      <Header />
      <HeroSection />
      <ProductShowcase />
      <ReviewsSection />
      <AdvantagesSection />
      <DeliverySection />
      <BeerTableSection />
      <BookingSection />
      <FAQSection />
      <ContactSection />
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
