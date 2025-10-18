-- Create social_user_profiles table for extended user profile information
CREATE TABLE IF NOT EXISTS social_user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  profile_image_url TEXT,
  cover_image_url TEXT,
  location VARCHAR(255),
  website_url VARCHAR(255),
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_social_user_profiles_user ON social_user_profiles(user_id);
