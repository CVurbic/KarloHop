import { Button } from "@/components/ui/button";
import { Phone, Mail, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { analytics } from "@/lib/analytics";

const navLinks = [
  { href: "#pocetna", label: "Početna" },
  { href: "#napuhanci", label: "Napuhanci" },
  { href: "#prednosti", label: "Prednosti" },
  { href: "#rezervacija", label: "Rezervacija" },
  { href: "#kontakt", label: "Kontakt" },
];

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    // Delay scroll until sheet close animation completes
    setTimeout(() => {
      const targetId = href.replace('#', '');
      scrollToSection(targetId);
    }, 300);
  };

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img src="/assets/logo.webp" alt="Hop Hop Napuhanci Logo" className="h-12 w-auto mascot-hover" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-foreground hover:text-primary transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          {/* Contact Info & CTA */}
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-4 text-sm">
              <a
                href="tel:+385958655213"
                onClick={() => analytics.trackPhoneClick("header")}
                className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>095 865 5213</span>
              </a>
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>info@hophop-napuhanci.com</span>
              </div>
            </div>
            <Button
              variant="default"
              className="hidden md:inline-flex gradient-primary hover:shadow-playful transition-all duration-300"
              onClick={() => scrollToSection('rezervacija')}
            >
              Rezerviraj
            </Button>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Otvori izbornik">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[360px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-left">Izbornik</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-4 mt-8">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => handleMobileLinkClick(e, link.href)}
                      className="text-foreground hover:text-primary transition-colors text-lg font-medium py-1"
                    >
                      {link.label}
                    </a>
                  ))}

                  <div className="border-t border-border pt-4 mt-4" />

                  <div className="space-y-3">
                    <a
                      href="tel:+385958655213"
                      onClick={() => { analytics.trackPhoneClick("mobile_menu"); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Phone className="h-5 w-5" />
                      <span>095 865 5213</span>
                    </a>
                    <a
                      href="mailto:info@hophop-napuhanci.com"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Mail className="h-5 w-5" />
                      <span className="text-sm">info@hophop-napuhanci.com</span>
                    </a>
                  </div>

                  <Button
                    variant="default"
                    className="w-full gradient-primary hover:shadow-playful transition-all duration-300 mt-4"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setTimeout(() => scrollToSection('rezervacija'), 300);
                    }}
                  >
                    Rezerviraj
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
