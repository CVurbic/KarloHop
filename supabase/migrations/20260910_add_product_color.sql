-- One identity color per bounce house, shown identically everywhere:
-- calendar dots, dashboard pie/badges, radnik maps, revenue chart.
-- Was previously derived (hash of slug) + a separate hardcoded map in the
-- dashboard, so the same bouncer showed different colors in different places.
ALTER TABLE products ADD COLUMN IF NOT EXISTS color TEXT;

-- Backfill the current catalog with the palette the dashboard pie already used.
UPDATE products SET color = '#3b82f6' WHERE color IS NULL AND slug LIKE 'minecraft%';
UPDATE products SET color = '#14b8a6' WHERE color IS NULL AND (slug LIKE 'dino%' OR slug LIKE 'dinosaur%');
UPDATE products SET color = '#ec4899' WHERE color IS NULL AND slug LIKE 'jednorog%';
UPDATE products SET color = '#eab308' WHERE color IS NULL AND slug LIKE 'paw-patrol%';
UPDATE products SET color = '#22c55e' WHERE color IS NULL AND slug LIKE 'nogomet%';
UPDATE products SET color = '#dc2626' WHERE color IS NULL AND slug LIKE 'super-mario%';
