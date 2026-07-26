-- 1) Allow products to be "hidden" (published-but-not-shown) in addition to
--    the existing 'draft' and 'published' statuses. Hidden products are not
--    returned by the public RLS policy, so they disappear from the site while
--    remaining editable in the admin.
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE products
  ADD CONSTRAINT products_status_check
  CHECK (status IN ('draft', 'published', 'hidden'));

-- 2) Add the new "Nogometni izazov" product (football challenge). A ball is
--    always included with the rental. Price 100€/dan like the others.
INSERT INTO products (name, slug, cover_image, image, gallery, short_desc, long_desc, dimensions, capacity, ages, included, price, seo_title, seo_description, seo_og_image, status, sort_order) VALUES
(
  'Nogometni izazov',
  'nogomet-napuhanac',
  '/assets/NOGOMET.png',
  '/assets/NOGOMET.png',
  '["\/assets\/NOGOMET.png"]',
  'Napuhanac nogometni izazov s loptom za male navijače',
  'Zabijte pobjednički gol! Nogometni izazov je napuhanac za sve male (i velike) ljubitelje nogometa — natjecateljska igra u kojoj se dva ili više igrača nadmeću tko će zabiti više golova. Uz napuhanac uvijek dolazi i lopta, pa zabava može početi odmah. Kompaktnih dimenzija, savršen za rođendane, sportske dane i sva okupljanja gdje želite malo natjecateljskog duha i puno smijeha.',
  '4 x 2.5 x 2.4m',
  '2 ili više igrača istovremeno',
  '4–14 godina',
  '["Lopta uključena uz najam","Dovoz ujutro (08:00–11:00), odvoz i demontaža od 19:00 nadalje","Besplatna dostava do 15km od Arene Zagreb","Montaža i demontaža na lokaciji"]',
  '100',
  'Nogometni izazov napuhanac za najam | Hop Hop Napuhanci Zagreb',
  'Nogometni izazov napuhanac s loptom za najam u Zagrebu! Dimenzije 4x2.5x2.4m, za 2 ili više igrača, uzrast 4–14 god. Dostava i montaža uključeni — 100€/dan.',
  '/assets/NOGOMET.png',
  'published',
  6
)
ON CONFLICT (slug) DO NOTHING;

-- 3) Hide the Super Mario Tobogan product from the site (kept in the DB so it
--    can be restored later and so historical bookings keep their reference).
--    Matched by name and slug prefix because the live slug may have been edited
--    in the admin (e.g. 'super-mario-tobogan-napuhanac').
UPDATE products SET status = 'hidden', updated_at = now()
WHERE name = 'Super Mario Tobogan' OR slug LIKE 'super-mario-tobogan%';

-- 4) Teach the booking normaliser about the new football challenge so bookings
--    that come in with any spelling get the canonical display name.
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
      WHEN 'nogomet', 'nogomet-napuhanac', 'nogometni izazov', 'nogometni-izazov', 'football' THEN
        NEW.selected_bounce_house := 'Nogometni izazov';
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
