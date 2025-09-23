import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <img 
                src="/assets/logo.png" 
                alt="Hop Hop Napuhanci Logo" 
                className="h-16 w-auto mr-4"
              />
            </div>
            <p className="text-background/80 mb-6 leading-relaxed">
              Hop Hop Napuhanci - vaš pouzdani partner za nezaboravnu dječju zabavu. 
              Kvalitetni napuhanci, sigurna dostava i profesionalna usluga već godinama 
              čine djecu sretnom diljem Zagreba.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="bg-primary p-3 rounded-full hover:bg-primary/80 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5 text-white" />
              </a>
              <a 
                href="#" 
                className="bg-secondary p-3 rounded-full hover:bg-secondary/80 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5 text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Brzi linkovi</h3>
            <ul className="space-y-2">
              <li>
                <a href="#home" className="text-background/80 hover:text-white transition-colors">
                  Početna
                </a>
              </li>
              <li>
                <a href="#products" className="text-background/80 hover:text-white transition-colors">
                  Napuhanci
                </a>
              </li>
              <li>
                <a href="#advantages" className="text-background/80 hover:text-white transition-colors">
                  Prednosti
                </a>
              </li>
              <li>
                <a href="#booking" className="text-background/80 hover:text-white transition-colors">
                  Rezervacija
                </a>
              </li>
              <li>
                <a href="#contact" className="text-background/80 hover:text-white transition-colors">
                  Kontakt
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Kontakt</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-primary mr-3" />
                <span className="text-background/80">01/234-5678</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-primary mr-3" />
                <span className="text-background/80">info@hophop.hr</span>
              </div>
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-primary mr-3 mt-1" />
                <span className="text-background/80">
                  Zagreb i okolica<br />
                  Dostava do 30km
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-background/60 text-sm">
            © 2024 Hop Hop Napuhanci. Sva prava pridržana.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-background/60 hover:text-white text-sm transition-colors">
              Pravila privatnosti
            </a>
            <a href="#" className="text-background/60 hover:text-white text-sm transition-colors">
              Uvjeti korištenja
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;