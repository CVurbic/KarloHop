-- Add scheduled_at column to blog_posts for scheduled publishing
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS scheduled_at timestamptz DEFAULT NULL;
