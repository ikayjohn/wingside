-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  author_name VARCHAR(255),
  category VARCHAR(100),
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(is_featured) WHERE is_featured = true;

-- Add RLS policies
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage blog posts" ON blog_posts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow public to read published posts
CREATE POLICY "Public can read published blog posts" ON blog_posts
  FOR SELECT
  TO public
  USING (is_published = true);

-- Allow authenticated users to read all posts (for preview)
CREATE POLICY "Authenticated can read all blog posts" ON blog_posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Add comments
COMMENT ON TABLE blog_posts IS 'Blog posts for Wingside website';
COMMENT ON COLUMN blog_posts.slug IS 'URL-friendly version of the title';
COMMENT ON COLUMN blog_posts.excerpt IS 'Short summary for blog listing';
COMMENT ON COLUMN blog_posts.is_featured IS 'Whether to show in featured section';
COMMENT ON COLUMN blog_posts.view_count IS 'Number of times the post has been viewed';
