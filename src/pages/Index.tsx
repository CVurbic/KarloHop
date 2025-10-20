import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ProductShowcase from "@/components/ProductShowcase";
import AdvantagesSection from "@/components/AdvantagesSection";
import DeliverySection from "@/components/DeliverySection";
import BeerTableSection from "@/components/BeerTableSection";
import BookingSection from "@/components/BookingSection";
import FAQSection from "@/components/FAQSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <ProductShowcase />
      <AdvantagesSection />
      <DeliverySection />
      <BeerTableSection />
      <BookingSection />
      <FAQSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
