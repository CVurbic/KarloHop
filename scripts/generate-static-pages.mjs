#!/usr/bin/env node
/**
 * Generates per-route HTML files in dist/<slug>/index.html so that each
 * product URL is served with its OWN <title>, description, canonical link,
 * og:url and structured data. Without this, the SPA shell is served for
 * every route — Google then de-duplicates everything against the homepage's
 * canonical and only indexes the homepage.
 *
 * Runs as a postbuild step. No headless browser required.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "..", "dist");
const SITE_URL = "https://hophop-napuhanci.com";

const products = [
  {
    slug: "jednorog-napuhanac",
    name: "Jednorog svijet",
    title: "Jednorog napuhanac za najam | Hop Hop Napuhanci Zagreb",
    description:
      "Iznajmite čarobni Jednorog napuhanac za dječji rođendan u Zagrebu! Dimenzije 5.5x4.5x4.5m, tobogan, do 6 djece. Dostava i postavljanje uključeni — 100€/dan.",
    image: "/assets/unicorn-cover.png",
    longDesc:
      "Čarobni jednorog napuhanac pretvara svaku proslavu u bajkovitu avanturu! Djeca obožavaju skakati okružena šarenim jednorozima dok se zabavljaju na toboganu.",
    dimensions: "5.5 x 4.5 x 4.5m",
    capacity: "Do 6 djece istovremeno",
    ages: "3–12 godina",
    price: "100",
  },
  {
    slug: "minecraft-napuhanac",
    name: "Minecraft party",
    title: "Minecraft napuhanac za najam | Hop Hop Napuhanci Zagreb",
    description:
      "Minecraft napuhanac s toboganom za najam u Zagrebu! Dimenzije 5.5x4.5x4.5m, do 6 djece, za uzrast 3-12 god. Dostava i montaža uključeni — samo 100€/dan.",
    image: "/assets/minecraft-cover.png",
    longDesc:
      "Pravi Minecraft doživljaj u stvarnom svijetu! Ovaj napuhanac donosi pixeliranu avanturu s toboganom koja će oduševiti svakog malog gejmera.",
    dimensions: "5.5 x 4.5 x 4.5m",
    capacity: "Do 6 djece istovremeno",
    ages: "3–12 godina",
    price: "100",
  },
  {
    slug: "dinosaur-napuhanac",
    name: "Dino park",
    title: "Dino park napuhanac za najam | Hop Hop Napuhanci Zagreb",
    description:
      "Dinosaur napuhanac za dječje rođendane u Zagrebu! Dimenzije 5.5x4x4.5m, tobogan, do 6 djece, uzrast 3-12 god. Besplatna dostava i montaža — 100€/dan.",
    image: "/assets/dino-cover.png",
    longDesc:
      "Povratak u doba dinosaura! Mali istraživači će uživati u skakanju među šarenim dinosaurima na ovom napuhancu koji budi maštu i donosi nezaboravnu zabavu.",
    dimensions: "5.5 x 4 x 4.5m",
    capacity: "Do 6 djece istovremeno",
    ages: "3–12 godina",
    price: "100",
  },
  {
    slug: "paw-patrol-napuhanac",
    name: "Paw Patrol avantura",
    title: "Paw Patrol napuhanac za najam | Hop Hop Napuhanci Zagreb",
    description:
      "Paw Patrol napuhanac s toboganom za najam u Zagrebu! Dimenzije 5x5x4m, do 6 djece, uzrast 3-12 god. Dostava i montaža uključeni — samo 100€/dan.",
    image: "/assets/paw-patrol.png",
    longDesc:
      "Pridruži se Chaseu, Marshallu i cijeloj Paw Patrol ekipi! Ovaj šareni napuhanac s toboganom donosi pravu spasilačku avanturu u tvoje dvorište.",
    dimensions: "5 x 5 x 4m",
    capacity: "Do 6 djece istovremeno",
    ages: "3–12 godina",
    price: "100",
  },
  {
    slug: "super-mario-tobogan",
    name: "Super Mario Tobogan",
    title: "Super Mario tobogan napuhanac za najam | Hop Hop Napuhanci Zagreb",
    description:
      "Super Mario tobogan napuhanac za najam u Zagrebu! Dimenzije 7x4.2x6m, veliki tobogan, do 6 djece, uzrast 3-12 god. Dostava i montaža uključeni — 150€/dan.",
    image: "/placeholder.svg",
    longDesc:
      "Skoči u svijet Super Marija! Veliki tobogan napuhanac, visok 6 metara, donosi pravu Mario avanturu u tvoje dvorište — savršen za rođendane i sve male obožavatelje kultne igre.",
    dimensions: "7 x 4.2 x 6m",
    capacity: "Do 6 djece istovremeno",
    ages: "3–12 godina",
    price: "150",
  },
];

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildBreadcrumb(product) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Početna",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: `${product.name} napuhanac`,
        item: `${SITE_URL}/${product.slug}`,
      },
    ],
  };
}

function buildProductSchema(product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.name} napuhanac`,
    description: product.longDesc,
    image: `${SITE_URL}${product.image}`,
    sku: product.slug,
    brand: { "@type": "Brand", name: "Hop Hop Napuhanci" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/${product.slug}`,
      priceCurrency: "EUR",
      price: product.price,
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: product.price,
        priceCurrency: "EUR",
        unitText: "dan",
      },
    },
  };
}

function rewriteMeta(html, product) {
  const url = `${SITE_URL}/${product.slug}`;
  const imageUrl = `${SITE_URL}${product.image}`;
  const title = escapeHtml(product.title);
  const description = escapeHtml(product.description);

  let out = html;

  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${description}">`
  );
  out = out.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${url}" />`
  );
  out = out.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${url}" />`
  );
  out = out.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${title}">`
  );
  out = out.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${description}">`
  );
  out = out.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:image" content="${imageUrl}">`
  );
  out = out.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${title}">`
  );
  out = out.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${description}">`
  );
  out = out.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:image" content="${imageUrl}">`
  );

  // Inject per-route structured data right before </head>
  const breadcrumbJson = JSON.stringify(buildBreadcrumb(product));
  const productJson = JSON.stringify(buildProductSchema(product));
  const injection = `<script type="application/ld+json">${breadcrumbJson}</script><script type="application/ld+json">${productJson}</script></head>`;
  out = out.replace(/<\/head>/, injection);

  // Replace the generic noscript fallback inside #root with product-specific
  // info so non-JS crawlers see the right H1/description for this page.
  const noscriptHtml = `<noscript><div style="max-width:800px;margin:0 auto;padding:40px 20px;font-family:system-ui,sans-serif"><h1>${escapeHtml(product.name)} napuhanac — najam u Zagrebu</h1><p>${escapeHtml(product.longDesc)}</p><ul><li>Dimenzije: ${escapeHtml(product.dimensions)}</li><li>Kapacitet: ${escapeHtml(product.capacity)}</li><li>Uzrast: ${escapeHtml(product.ages)}</li><li>Cijena: ${product.price}€/dan</li></ul><p><a href="/">← Natrag na početnu</a></p><p>Telefon: <a href="tel:+385958655213">095 865 5213</a> · Email: <a href="mailto:info@hophop-napuhanci.com">info@hophop-napuhanci.com</a></p></div></noscript>`;
  out = out.replace(/<noscript>[\s\S]*?<\/noscript>/, noscriptHtml);

  return out;
}

async function main() {
  const indexPath = path.join(DIST_DIR, "index.html");
  let baseHtml;
  try {
    baseHtml = await fs.readFile(indexPath, "utf8");
  } catch (err) {
    console.error(`[generate-static-pages] dist/index.html not found at ${indexPath}. Did you run 'vite build' first?`);
    process.exit(1);
  }

  for (const product of products) {
    const html = rewriteMeta(baseHtml, product);
    const dir = path.join(DIST_DIR, product.slug);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "index.html"), html, "utf8");
    console.log(`[generate-static-pages] wrote dist/${product.slug}/index.html`);
  }
}

main().catch((err) => {
  console.error("[generate-static-pages] failed:", err);
  process.exit(1);
});
