export interface Product {
  id: number;
  name: string;
  slug: string;
  coverImage: string;
  image: string;
  gallery: string[];
  shortDesc: string;
  longDesc: string;
  dimensions: string;
  capacity: string;
  ages: string;
  included: string[];
  price: string;
  seo: {
    title: string;
    description: string;
    ogImage: string;
  };
}

export const napuhanci: Product[] = [
  {
    id: 1,
    name: "Jednorog svijet",
    slug: "jednorog-napuhanac",
    coverImage: "/assets/unicorn-cover.png",
    image: "/assets/jednorog-new.webp",
    gallery: [
      "/assets/unicorn-cover.png",
      "/assets/unicorn-1.webp",
      "/assets/unicorn-2.webp",
      "/assets/unicorn-3.webp",
      "/assets/unicorn-4.webp",
    ],
    shortDesc: "Napuhanac s jednorozima za male princeze",
    longDesc:
      "Čarobni jednorog napuhanac pretvara svaku proslavu u bajkovitu avanturu! Djeca obožavaju skakati okružena šarenim jednorozima dok se zabavljaju na toboganu. Savršen za rođendane, vrtne zabave i sva dječja okupljanja gdje je cilj — čista magija i smijeh.",
    dimensions: "5.5 x 4.5 x 4.5m",
    capacity: "Do 6 djece istovremeno",
    ages: "3–12 godina",
    included: [
      "Najam napuhanca za cijeli dan (8h)",
      "Besplatna dostava do 15km od Arene Zagreb",
      "Montaža i demontaža na lokaciji",
    ],
    price: "100",
    seo: {
      title: "Jednorog napuhanac za najam | Hop Hop Napuhanci Zagreb",
      description:
        "Iznajmite čarobni Jednorog napuhanac za dječji rođendan u Zagrebu! Dimenzije 5.5x4.5x4.5m, tobogan, do 6 djece. Dostava i postavljanje uključeni — 100€/dan.",
      ogImage: "/assets/unicorn-cover.png",
    },
  },
  {
    id: 2,
    name: "Minecraft party",
    slug: "minecraft-napuhanac",
    coverImage: "/assets/minecraft-cover.png",
    image: "/assets/minecraft-new.webp",
    gallery: [
      "/assets/minecraft-cover.png",
      "/assets/minecraft-1.webp",
      "/assets/minecraft-2.webp",
      "/assets/minecraft-3.webp",
      "/assets/minecraft-4.webp",
    ],
    shortDesc: "Minecraft avantura u napuhancu s toboganom",
    longDesc:
      "Pravi Minecraft doživljaj u stvarnom svijetu! Ovaj napuhanac donosi pixeliranu avanturu s toboganom koja će oduševiti svakog malog gejmera. Skakanje, penjanje i tobogan — sve u Minecraft stilu koji djeca obožavaju. Idealan za rođendane i gaming partije na otvorenom.",
    dimensions: "5.5 x 4.5 x 4.5m",
    capacity: "Do 6 djece istovremeno",
    ages: "3–12 godina",
    included: [
      "Najam napuhanca za cijeli dan (8h)",
      "Besplatna dostava do 15km od Arene Zagreb",
      "Montaža i demontaža na lokaciji",
    ],
    price: "100",
    seo: {
      title: "Minecraft napuhanac za najam | Hop Hop Napuhanci Zagreb",
      description:
        "Minecraft napuhanac s toboganom za najam u Zagrebu! Dimenzije 5.5x4.5x4.5m, do 6 djece, za uzrast 3-12 god. Dostava i montaža uključeni — samo 100€/dan.",
      ogImage: "/assets/minecraft-cover.png",
    },
  },
  {
    id: 3,
    name: "Dino park",
    slug: "dinosaur-napuhanac",
    coverImage: "/assets/dino-cover.png",
    image: "/assets/dino-product-main.webp",
    gallery: [
      "/assets/dino-cover.png",
      "/assets/dino-1.webp",
      "/assets/dino-2.webp",
      "/assets/dino-3.webp",
      "/assets/dino-4.webp",
    ],
    shortDesc: "Zabava u Dinosaur napuhancu za male istraživače",
    longDesc:
      "Povratak u doba dinosaura! Mali istraživači će uživati u skakanju među šarenim dinosaurima na ovom napuhancu koji budi maštu i donosi nezaboravnu zabavu. S toboganom i prostorom za skakanje, Dino park napuhanac je hit svake proslave na otvorenom.",
    dimensions: "5.5 x 4 x 4.5m",
    capacity: "Do 6 djece istovremeno",
    ages: "3–12 godina",
    included: [
      "Najam napuhanca za cijeli dan (8h)",
      "Besplatna dostava do 15km od Arene Zagreb",
      "Montaža i demontaža na lokaciji",
    ],
    price: "100",
    seo: {
      title: "Dino park napuhanac za najam | Hop Hop Napuhanci Zagreb",
      description:
        "Dinosaur napuhanac za dječje rođendane u Zagrebu! Dimenzije 5.5x4x4.5m, tobogan, do 6 djece, uzrast 3-12 god. Besplatna dostava i montaža — 100€/dan.",
      ogImage: "/assets/dino-cover.png",
    },
  },
  {
    id: 4,
    name: "Paw Patrol avantura",
    slug: "paw-patrol-napuhanac",
    coverImage: "/assets/paw-patrol.png",
    image: "/assets/paw-patrol.png",
    gallery: [
      "/assets/paw-patrol.png",
    ],
    shortDesc: "Paw Patrol napuhanac s toboganom za male spasioce",
    longDesc:
      "Pridruži se Chaseu, Marshallu i cijeloj Paw Patrol ekipi! Ovaj šareni napuhanac s toboganom donosi pravu spasilačku avanturu u tvoje dvorište. Djeca obožavaju skakati uz svoje omiljene junake i spuštati se toboganom — savršen izbor za rođendane, vrtne zabave i sve male obožavatelje Paw Patrola.",
    dimensions: "5 x 5 x 4m",
    capacity: "Do 6 djece istovremeno",
    ages: "3–12 godina",
    included: [
      "Najam napuhanca za cijeli dan (8h)",
      "Besplatna dostava do 15km od Arene Zagreb",
      "Montaža i demontaža na lokaciji",
    ],
    price: "100",
    seo: {
      title: "Paw Patrol napuhanac za najam | Hop Hop Napuhanci Zagreb",
      description:
        "Paw Patrol napuhanac s toboganom za najam u Zagrebu! Dimenzije 5x5x4m, do 6 djece, uzrast 3-12 god. Dostava i montaža uključeni — samo 100€/dan.",
      ogImage: "/assets/paw-patrol.png",
    },
  },
  {
    id: 5,
    name: "Super Mario Tobogan",
    slug: "super-mario-tobogan",
    coverImage: "/placeholder.svg",
    image: "/placeholder.svg",
    gallery: [
      "/placeholder.svg",
    ],
    shortDesc: "Veliki Super Mario tobogan za prave avanture",
    longDesc:
      "Skoči u svijet Super Marija! Ovaj veliki tobogan napuhanac donosi pravu Mario avanturu u tvoje dvorište — savršen za rođendane i sve male obožavatelje kultne igre. Visok 6 metara s velikim toboganom, dovoljno prostora za skakanje i penjanje. Idealan kada želiš pravu wow proslavu koju djeca neće zaboraviti.",
    dimensions: "7 x 4.2 x 6m",
    capacity: "Do 6 djece istovremeno",
    ages: "3–12 godina",
    included: [
      "Najam napuhanca za cijeli dan (8h)",
      "Besplatna dostava do 15km od Arene Zagreb",
      "Montaža i demontaža na lokaciji",
    ],
    price: "150",
    seo: {
      title: "Super Mario tobogan napuhanac za najam | Hop Hop Napuhanci Zagreb",
      description:
        "Super Mario tobogan napuhanac za najam u Zagrebu! Dimenzije 7x4.2x6m, veliki tobogan, do 6 djece, uzrast 3-12 god. Dostava i montaža uključeni — 150€/dan.",
      ogImage: "/placeholder.svg",
    },
  },
];
