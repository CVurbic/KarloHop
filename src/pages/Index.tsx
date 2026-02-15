import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ProductShowcase from "@/components/ProductShowcase";
import ReviewsSection from "@/components/ReviewsSection";
import AdvantagesSection from "@/components/AdvantagesSection";
import DeliverySection from "@/components/DeliverySection";
import BookingSection from "@/components/BookingSection";
import FAQSection from "@/components/FAQSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const Index = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />
      <HeroSection />
      <ProductShowcase />
      <ReviewsSection />
      <AdvantagesSection />
      <DeliverySection />
      <BookingSection />
      <FAQSection />
      <ContactSection />
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
