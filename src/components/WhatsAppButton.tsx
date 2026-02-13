import { MessageCircle } from "lucide-react";
import { analytics } from "@/lib/analytics";

const WhatsAppButton = () => {
  const phoneNumber = "385958655213"; // Croatian format without +
  const message = "Pozdrav! Zanima me najam napuhanca.";
  
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => analytics.trackWhatsAppClick()}
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5C] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
      aria-label="Kontaktirajte nas putem WhatsApp-a"
    >
      <MessageCircle className="h-7 w-7 fill-white" />
      <span className="absolute right-full mr-3 bg-foreground text-background px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        Pišite nam na WhatsApp
      </span>
    </a>
  );
};

export default WhatsAppButton;
