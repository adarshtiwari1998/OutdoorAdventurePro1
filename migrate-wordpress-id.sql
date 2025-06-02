
-- Add wordpress_id column to blog_posts table
ALTER TABLE blog_posts ADD COLUMN wordpress_id INTEGER;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_wordpress_id ON blog_posts(wordpress_id);
