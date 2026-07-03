import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQSection = () => {
  const faqs = [
    {
      question: "Što je uključeno u najam napuhanca?",
      answer: "U cijenu najma napuhanca kod nas obično je uključeno: najam napuhanca za jedan dan, te osnovno osiguranje i čišćenje nakon upotrebe. Ako imate potrebu za dodatnim danom, on dolazi uz popust te ga je potrebno navesti prilikom rezervacije."
    },
    {
      question: "Kako ranije napraviti rezervaciju i koliko unaprijed?",
      answer: "Preporučujemo da rezervirate barem 2-4 tjedna unaprijed, osobito za vikende i visoku sezonu (svibanj – rujan). Vaša rezervacija je zaprimljena čim ispunite online zahtjev — javit ćemo vam se samo ukoliko budu potrebni dodatni detalji. Cjelokupan iznos plaća se online uz zahtjev linka za plaćanje ili na licu mjesta prilikom preuzimanja (gotovinom, bankovnim prijenosom ili karticom)."
    },
    {
      question: "Na koje lokacije dostavljamo napuhance?",
      answer: "Dostavljamo napuhance besplatno unutar 15 km od Arene Zagreb. Za sve lokacije izvan tog radijusa (npr. Velika Gorica, Samobor, Zaprešić, Sesvete) dostava se naplaćuje 40€. Ako vaša lokacija zahtijeva posebne uvjete (neravan teren, daleka udaljenost), obratite nam se za besplatnu procjenu."
    },
    {
      question: "Koliko dugo traje najam i mogu li produžiti vrijeme najma?",
      answer: "Dovoz je ujutro između 08:00 i 11:00, a odvoz i demontaža su od 19:00 nadalje. Produženje najma moguće je i na drugi dan uz 50% uštede. U tom slučaju dolazimo drugi dan predvečer po napuhanac."
    },
    {
      question: "Koje su sigurnosne mjere za napuhance?",
      answer: "Sigurnost nam je prioritet. Naši napuhanci su redovito pregledavani, imaju EU certifikate i izrađeni su od kvalitetnih materijala. Pristup skakanju mora biti pod nadzorom odraslih te je potrebno prije korištenja potpisati izjavu o korištenju na vlastitu odgovornost. Napuhanci se postavljaju na ravnu i stabilnu površinu, osigurana je zaštita i pravilno pričvršćivanje."
    },
    {
      question: "Kako se održava higijena napuhanaca?",
      answer: "Higijena nam je izuzetno važna. Svaki napuhanac temeljito čistimo i dezinficiramo prije i nakon svake uporabe. Dodatno, jednom mjesečno provodimo dubinsko čišćenje svih napuhanaca kako bismo osigurali maksimalnu čistoću i sigurnost za djecu."
    },
    {
      question: "Što ako pada kiša ili je loše vrijeme?",
      answer: "Ako vremenske prilike onemoguće siguran rad (jaka kiša, vjetar iznad sigurnosne granice), imate mogućnost otkazivanja najma bez naknade ili promjenu termina bez dodatnih troškova. Svakako nas kontaktirajte najkasnije 12 sati prije početka najma."
    },
    {
      question: "Mogu li napuhance koristiti vani i u zatvorenom?",
      answer: "Da, naši napuhanci se mogu postaviti i u unutarnjim prostorima (sportske dvorane, igraonice) i vani (dvorišta, parkovi). Kod vanjske upotrebe osiguravamo zaštitu od vjetra i izazova terena uz pričvršćivanje. Kod unutarnje upotrebe potrebno je osigurati dovoljnu visinu stropa, idealno barem 4m, i slobodan prostor oko atrakcije."
    },
    {
      question: "Ima li kakvih skrivenih troškova?",
      answer: "Ne – kod nas nema skrivenih troškova. Sve što dogovorimo nalazi se u ponudi. Dodatni trošak može nastati jedino ako je lokacija izvan zone dostave. Sve te dodatke jasno navodimo u pisanom odgovoru i ponudi."
    },
    {
      question: "Kako da se pripremim za montažu napuhanca?",
      answer: "Osigurajte ravnu površinu (travnjak ili beton), bez oštrih objekata i prepreka. Jasno označite pristup dostavnom vozilu. Učinite lokaciju sigurnom za djecu i uklonite nepotrebne predmete. Obavijestite nas unaprijed ako postoji nešto posebno (npr. proslava uz bazen, vanjski električni priključak)."
    },
    {
      question: "Kako se odvija plaćanje i otkazivanje?",
      answer: "Plaćanje je moguće online, uz zahtjev linka za plaćanje, ili na licu mjesta prilikom preuzimanja napuhanca (gotovinom, bankovnim prijenosom ili karticom) — na lokaciji dostave ili u našoj garaži na adresi Lanište 26."
    },
    {
      question: "Mogu li vidjeti više o napuhancima i rezervacijama?",
      answer: "Da, na našoj web-stranici i društvenim mrežama možete pogledati galeriju slika i kratke videozapise s prošlih događanja. To je odličan način da vidite kako napuhanci izgledaju u akciji i kako izgleda priprema događaja."
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Česta pitanja (FAQ)
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Odgovori na najčešće postavljana pitanja o najmu napuhanaca
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card border border-border rounded-lg px-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary py-6 pr-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 pt-2 leading-relaxed text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
