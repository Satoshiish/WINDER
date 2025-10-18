-- Create social_posts table for user posts
CREATE TABLE IF NOT EXISTS social_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  privacy_level VARCHAR(50) DEFAULT 'public' CHECK (privacy_level IN ('public', 'friends', 'private')),
  location_name VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created ON social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_privacy ON social_posts(privacy_level);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
