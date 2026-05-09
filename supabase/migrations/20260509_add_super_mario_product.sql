-- Add Super Mario Tobogan bounce house product
INSERT INTO products (name, slug, cover_image, image, gallery, short_desc, long_desc, dimensions, capacity, ages, included, price, seo_title, seo_description, seo_og_image, status, sort_order) VALUES
(
  'Super Mario Tobogan',
  'super-mario-tobogan',
  '/placeholder.svg',
  '/placeholder.svg',
  '["\/placeholder.svg"]',
  'Veliki Super Mario tobogan za prave avanture',
  'Skoči u svijet Super Marija! Ovaj veliki tobogan napuhanac donosi pravu Mario avanturu u tvoje dvorište — savršen za rođendane i sve male obožavatelje kultne igre. Visok 6 metara s velikim toboganom, dovoljno prostora za skakanje i penjanje. Idealan kada želiš pravu wow proslavu koju djeca neće zaboraviti.',
  '7 x 4.2 x 6m',
  'Do 6 djece istovremeno',
  '3–12 godina',
  '["Najam napuhanca za cijeli dan (8h)","Besplatna dostava do 10km od Zagreba","Montaža i demontaža na lokaciji"]',
  '150',
  'Super Mario tobogan napuhanac za najam | Hop Hop Napuhanci Zagreb',
  'Super Mario tobogan napuhanac za najam u Zagrebu! Dimenzije 7x4.2x6m, veliki tobogan, do 6 djece, uzrast 3-12 god. Dostava i montaža uključeni — 150€/dan.',
  '/placeholder.svg',
  'published',
  5
)
ON CONFLICT (slug) DO NOTHING;

-- Update normalize_booking trigger so that bookings without an explicit price
-- get the correct default for each bouncer (Super Mario = 150, others = 100).
CREATE OR REPLACE FUNCTION normalize_booking()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Normalize bounce house name from slug to display name
  IF NEW.selected_bounce_house IS NOT NULL THEN
    CASE lower(NEW.selected_bounce_house)
      WHEN 'minecraft', 'minecraft-party', 'minecraft party' THEN
        NEW.selected_bounce_house := 'Minecraft Party';
      WHEN 'dino', 'dino-park', 'dino park', 'dinopark' THEN
        NEW.selected_bounce_house := 'Dino Park';
      WHEN 'jednorog', 'jednorog-svijet', 'jednorog svijet', 'unicorn' THEN
        NEW.selected_bounce_house := 'Jednorog';
      WHEN 'super mario', 'super-mario', 'mario', 'super mario tobogan', 'super-mario-tobogan' THEN
        NEW.selected_bounce_house := 'Super Mario';
      ELSE
        -- leave as-is if already correct or unknown
        NULL;
    END CASE;
  END IF;

  -- Set default price based on bouncer when not provided
  IF NEW.price IS NULL THEN
    IF NEW.selected_bounce_house = 'Super Mario' THEN
      NEW.price := 150;
    ELSE
      NEW.price := 100;
    END IF;
  END IF;

  -- Set status to confirmed for new bookings that come in as pending
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    NEW.status := 'confirmed';
  END IF;

  RETURN NEW;
END;
$$;
