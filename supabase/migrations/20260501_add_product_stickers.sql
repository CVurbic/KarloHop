-- Add independent product stickers (e.g. "Novo", "Akcija") with custom color.
-- These are rendered on the product card / page regardless of discount price.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sticker_text TEXT,
  ADD COLUMN IF NOT EXISTS sticker_color TEXT;
