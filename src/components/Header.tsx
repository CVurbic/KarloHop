import { Button } from "@/components/ui/button";
import { Phone, Mail } from "lucide-react";
const Header = () => {
  return <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img src="/assets/logo.png" alt="Hop Hop Napuhanci Logo" className="h-12 w-auto mascot-hover" />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-foreground hover:text-primary transition-colors">
              Početna
            </a>
            <a href="#products" className="text-foreground hover:text-primary transition-colors">
              Napuhanci
            </a>
            <a href="#advantages" className="text-foreground hover:text-primary transition-colors">Setovi stolova</a>
            <a href="#booking" className="text-foreground hover:text-primary transition-colors">
              Rezervacija
            </a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors">
              Kontakt
            </a>
          </nav>

          {/* Contact Info & CTA */}
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>095 865 5213</span>
              </div>
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>info@hophop-napuhanci.com</span>
              </div>
            </div>
            <Button variant="default" className="gradient-primary hover:shadow-playful transition-all duration-300">
              Rezerviraj
            </Button>
          </div>
        </div>
      </div>
    </header>;
};
export default Header;