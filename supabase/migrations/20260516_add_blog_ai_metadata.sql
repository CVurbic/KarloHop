-- Track which blog posts were AI-generated and from which topic.
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES public.blog_topic_queue(id) ON DELETE SET NULL;
