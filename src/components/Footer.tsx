import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

// TikTok icon component
const TikTok = ({
  className
}: {
  className?: string;
}) => <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>;
const Footer = () => {
  return <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <img src="/assets/logo.webp" alt="Hop Hop Napuhanci Logo" className="h-16 w-auto mr-4" />
            </div>
            <p className="text-background/80 mb-6 leading-relaxed">Hop Hop Napuhanci – najam napuhanaca za dječje rođendane, proslave i događanja. Naši sigurni i kvalitetni dvorci, tobogani i tematski napuhanci uz brzu dostavu i profesionalnu uslugu uveseljavaju djecu diljem Zagreba i okolice.</p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/hophopnapuhanci" target="_blank" rel="noopener noreferrer" className="bg-primary p-3 rounded-full hover:bg-primary/80 transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5 text-white" />
              </a>
              <a href="https://www.instagram.com/hophopnapuhanci/" target="_blank" rel="noopener noreferrer" className="bg-secondary p-3 rounded-full hover:bg-secondary/80 transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5 text-white" />
              </a>
              <a href="https://www.tiktok.com/@hophopnapuhanci" target="_blank" rel="noopener noreferrer" className="bg-accent p-3 rounded-full hover:bg-accent/80 transition-colors" aria-label="TikTok">
                <TikTok className="h-5 w-5 text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Brzi linkovi</h3>
            <ul className="space-y-2">
              <li>
                <a href="#pocetna" className="text-background/80 hover:text-white transition-colors">
                  Početna
                </a>
              </li>
              <li>
                <a href="#napuhanci" className="text-background/80 hover:text-white transition-colors">
                  Napuhanci
                </a>
              </li>
              <li>
                <a href="#prednosti" className="text-background/80 hover:text-white transition-colors">
                  Prednosti
                </a>
              </li>
              <li>
                <a href="#rezervacija" className="text-background/80 hover:text-white transition-colors">
                  Rezervacija
                </a>
              </li>
              <li>
                <a href="#kontakt" className="text-background/80 hover:text-white transition-colors">
                  Kontakt
                </a>
              </li>
              <li>
                <Link to="/savjeti" className="text-background/80 hover:text-white transition-colors">
                  Savjeti i ideje
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Kontakt</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-primary mr-3" />
                <span className="text-background/80">095 865 5213</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-primary mr-3" />
                <span className="text-background/80">info@hophop-napuhanci.com</span>
              </div>
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-primary mr-3 mt-1" />
                <span className="text-background/80">
                  Lanište 26, Zagreb<br />
                  Dostava do 30km
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-background/60 text-sm">
            © 2025 Hop Hop Napuhanci. Sva prava pridržana.
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
    </footer>;
};
export default Footer;