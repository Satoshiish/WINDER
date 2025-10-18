-- Create volunteer_areas table to assign volunteers to specific barangays/areas
CREATE TABLE IF NOT EXISTS volunteer_areas (
  id SERIAL PRIMARY KEY,
  volunteer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  barangay VARCHAR(255) NOT NULL,
  municipality VARCHAR(255) NOT NULL,
  province VARCHAR(255) NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(volunteer_id, barangay, municipality)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_volunteer_areas_volunteer ON volunteer_areas(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_areas_barangay ON volunteer_areas(barangay);

-- Insert sample volunteer area assignments
INSERT INTO volunteer_areas (volunteer_id, barangay, municipality, province, is_active)
SELECT u.id, 'Barangay 1', 'Tacloban City', 'Leyte', true
FROM users u WHERE u.email = 'volunteer1@weather.ph'
ON CONFLICT (volunteer_id, barangay, municipality) DO NOTHING;

INSERT INTO volunteer_areas (volunteer_id, barangay, municipality, province, is_active)
SELECT u.id, 'Barangay 2', 'Tacloban City', 'Leyte', true
FROM users u WHERE u.email = 'volunteer2@weather.ph'
ON CONFLICT (volunteer_id, barangay, municipality) DO NOTHING;
