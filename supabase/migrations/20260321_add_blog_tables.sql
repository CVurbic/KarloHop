-- Blog posts table for "Savjeti i ideje" section
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cover_image TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  excerpt TEXT,
  seo_title TEXT,
  seo_description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts only
CREATE POLICY "Public can read published posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- Admins have full access
CREATE POLICY "Admins can do everything with posts"
  ON blog_posts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for faster slug lookups
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
