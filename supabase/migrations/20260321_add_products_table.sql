-- Products table for managing bounce house products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cover_image TEXT,
  image TEXT,
  gallery JSONB DEFAULT '[]',
  short_desc TEXT,
  long_desc TEXT,
  dimensions TEXT,
  capacity TEXT,
  ages TEXT,
  included JSONB DEFAULT '[]',
  price TEXT NOT NULL DEFAULT '0',
  discount_price TEXT,
  discount_label TEXT,
  seo_title TEXT,
  seo_description TEXT,
  seo_og_image TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public can read published products only
CREATE POLICY "Public can read published products"
  ON products FOR SELECT
  USING (status = 'published');

-- Admins have full access
CREATE POLICY "Admins can do everything with products"
  ON products FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_sort_order ON products(sort_order);

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product-images bucket
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Seed existing products
INSERT INTO products (name, slug, cover_image, image, gallery, short_desc, long_desc, dimensions, capacity, ages, included, price, seo_title, seo_description, seo_og_image, status, sort_order) VALUES
(
  'Jednorog svijet',
  'jednorog-napuhanac',
  '/assets/unicorn-cover.png',
  '/assets/jednorog-new.webp',
  '["\/assets\/unicorn-cover.png","\/assets\/unicorn-1.webp","\/assets\/unicorn-2.webp","\/assets\/unicorn-3.webp","\/assets\/unicorn-4.webp"]',
  'Napuhanac s jednorozima za male princeze',
  'Čarobni jednorog napuhanac pretvara svaku proslavu u bajkovitu avanturu! Djeca obožavaju skakati okružena šarenim jednorozima dok se zabavljaju na toboganu. Savršen za rođendane, vrtne zabave i sva dječja okupljanja gdje je cilj — čista magija i smijeh.',
  '5.5 x 4.5 x 4.5m',
  'Do 6 djece istovremeno',
  '3–12 godina',
  '["Najam napuhanca za cijeli dan (8h)","Besplatna dostava do 10km od Zagreba","Montaža i demontaža na lokaciji"]',
  '100',
  'Jednorog napuhanac za najam | Hop Hop Napuhanci Zagreb',
  'Iznajmite čarobni Jednorog napuhanac za dječji rođendan u Zagrebu! Dimenzije 5.5x4.5x4.5m, tobogan, do 6 djece. Dostava i postavljanje uključeni — 100€/dan.',
  '/assets/unicorn-cover.png',
  'published',
  1
),
(
  'Minecraft party',
  'minecraft-napuhanac',
  '/assets/minecraft-cover.png',
  '/assets/minecraft-new.webp',
  '["\/assets\/minecraft-cover.png","\/assets\/minecraft-1.webp","\/assets\/minecraft-2.webp","\/assets\/minecraft-3.webp","\/assets\/minecraft-4.webp"]',
  'Minecraft avantura u napuhancu s toboganom',
  'Pravi Minecraft doživljaj u stvarnom svijetu! Ovaj napuhanac donosi pixeliranu avanturu s toboganom koja će oduševiti svakog malog gejmera. Skakanje, penjanje i tobogan — sve u Minecraft stilu koji djeca obožavaju. Idealan za rođendane i gaming partije na otvorenom.',
  '5.5 x 4.5 x 4.5m',
  'Do 6 djece istovremeno',
  '3–12 godina',
  '["Najam napuhanca za cijeli dan (8h)","Besplatna dostava do 10km od Zagreba","Montaža i demontaža na lokaciji"]',
  '100',
  'Minecraft napuhanac za najam | Hop Hop Napuhanci Zagreb',
  'Minecraft napuhanac s toboganom za najam u Zagrebu! Dimenzije 5.5x4.5x4.5m, do 6 djece, za uzrast 3-12 god. Dostava i montaža uključeni — samo 100€/dan.',
  '/assets/minecraft-cover.png',
  'published',
  2
),
(
  'Dino park',
  'dinosaur-napuhanac',
  '/assets/dino-cover.png',
  '/assets/dino-product-main.webp',
  '["\/assets\/dino-cover.png","\/assets\/dino-1.webp","\/assets\/dino-2.webp","\/assets\/dino-3.webp","\/assets\/dino-4.webp"]',
  'Zabava u Dinosaur napuhancu za male istraživače',
  'Povratak u doba dinosaura! Mali istraživači će uživati u skakanju među šarenim dinosaurima na ovom napuhancu koji budi maštu i donosi nezaboravnu zabavu. S toboganom i prostorom za skakanje, Dino park napuhanac je hit svake proslave na otvorenom.',
  '5.5 x 4 x 4.5m',
  'Do 6 djece istovremeno',
  '3–12 godina',
  '["Najam napuhanca za cijeli dan (8h)","Besplatna dostava do 10km od Zagreba","Montaža i demontaža na lokaciji"]',
  '100',
  'Dino park napuhanac za najam | Hop Hop Napuhanci Zagreb',
  'Dinosaur napuhanac za dječje rođendane u Zagrebu! Dimenzije 5.5x4x4.5m, tobogan, do 6 djece, uzrast 3-12 god. Besplatna dostava i montaža — 100€/dan.',
  '/assets/dino-cover.png',
  'published',
  3
);
