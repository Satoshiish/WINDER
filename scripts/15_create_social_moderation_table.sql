-- Create social_moderation table for content moderation
CREATE TABLE IF NOT EXISTS social_moderation (
  id SERIAL PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('post', 'comment')),
  content_id INTEGER NOT NULL,
  reported_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  reason VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected', 'removed')),
  moderator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  moderator_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_social_moderation_status ON social_moderation(status);
CREATE INDEX IF NOT EXISTS idx_social_moderation_content ON social_moderation(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_social_moderation_created ON social_moderation(created_at DESC);
