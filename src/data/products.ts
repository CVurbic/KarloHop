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
      "/assets/jednorog-new.webp",
      "/assets/uni-product.webp",
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
      "Besplatna dostava do 10km od Zagreba",
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
      "/assets/minecraft-new.webp",
      "/assets/mcp-product.webp",
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
      "Besplatna dostava do 10km od Zagreba",
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
      "/assets/dino-product-main.webp",
      "/assets/dino-product.webp",
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
      "Besplatna dostava do 10km od Zagreba",
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
];
