-- Create social_likes table for post likes
CREATE TABLE IF NOT EXISTS social_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_social_likes_post ON social_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_social_likes_user ON social_likes(user_id);
