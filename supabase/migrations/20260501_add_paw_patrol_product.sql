-- Add Paw Patrol bounce house product
INSERT INTO products (name, slug, cover_image, image, gallery, short_desc, long_desc, dimensions, capacity, ages, included, price, seo_title, seo_description, seo_og_image, status, sort_order) VALUES
(
  'Paw Patrol avantura',
  'paw-patrol-napuhanac',
  '/assets/paw-patrol.png',
  '/assets/paw-patrol.png',
  '["\/assets\/paw-patrol.png"]',
  'Paw Patrol napuhanac s toboganom za male spasioce',
  'Pridruži se Chaseu, Marshallu i cijeloj Paw Patrol ekipi! Ovaj šareni napuhanac s toboganom donosi pravu spasilačku avanturu u tvoje dvorište. Djeca obožavaju skakati uz svoje omiljene junake i spuštati se toboganom — savršen izbor za rođendane, vrtne zabave i sve male obožavatelje Paw Patrola.',
  '5 x 5 x 4m',
  'Do 6 djece istovremeno',
  '3–12 godina',
  '["Najam napuhanca za cijeli dan (8h)","Besplatna dostava do 10km od Zagreba","Montaža i demontaža na lokaciji"]',
  '100',
  'Paw Patrol napuhanac za najam | Hop Hop Napuhanci Zagreb',
  'Paw Patrol napuhanac s toboganom za najam u Zagrebu! Dimenzije 5x5x4m, do 6 djece, uzrast 3-12 god. Dostava i montaža uključeni — samo 100€/dan.',
  '/assets/paw-patrol.png',
  'published',
  4
)
ON CONFLICT (slug) DO NOTHING;
