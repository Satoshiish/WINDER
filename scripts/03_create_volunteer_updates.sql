-- Create volunteer_updates table for weather and situation updates
CREATE TABLE IF NOT EXISTS volunteer_updates (
  id SERIAL PRIMARY KEY,
  volunteer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  barangay VARCHAR(255) NOT NULL,
  municipality VARCHAR(255) NOT NULL,
  province VARCHAR(255) NOT NULL,
  update_type VARCHAR(50) NOT NULL CHECK (update_type IN ('weather', 'flood', 'evacuation', 'damage', 'safety', 'other')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'moderate', 'high', 'critical')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_volunteer_updates_volunteer ON volunteer_updates(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_updates_barangay ON volunteer_updates(barangay);
CREATE INDEX IF NOT EXISTS idx_volunteer_updates_type ON volunteer_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_volunteer_updates_severity ON volunteer_updates(severity);
CREATE INDEX IF NOT EXISTS idx_volunteer_updates_status ON volunteer_updates(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_updates_created ON volunteer_updates(created_at DESC);
