-- Create social_followers table for user relationships
CREATE TABLE IF NOT EXISTS social_followers (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'muted')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_social_followers_follower ON social_followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_social_followers_following ON social_followers(following_id);
