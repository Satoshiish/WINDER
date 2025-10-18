-- Create social_shares table for post shares
CREATE TABLE IF NOT EXISTS social_shares (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_type VARCHAR(50) DEFAULT 'share' CHECK (share_type IN ('share', 'repost', 'forward')),
  shared_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_social_shares_post ON social_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_user ON social_shares(user_id);
