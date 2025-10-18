-- Create social_comments table for post comments
CREATE TABLE IF NOT EXISTS social_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'flagged')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_social_comments_post ON social_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_user ON social_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_created ON social_comments(created_at DESC);
