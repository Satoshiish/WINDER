-- Updated to reference volunteers table instead of users table
-- Create volunteer_areas table to assign volunteers to specific barangays/areas
CREATE TABLE IF NOT EXISTS volunteer_areas (
  id SERIAL PRIMARY KEY,
  volunteer_id INTEGER NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
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
SELECT v.id, 'Barangay Barretto', 'Olongapo City', 'Zambales', true
FROM volunteers v WHERE v.email = 'volunteer1@weatherhub.ph'
ON CONFLICT (volunteer_id, barangay, municipality) DO NOTHING;

INSERT INTO volunteer_areas (volunteer_id, barangay, municipality, province, is_active)
SELECT v.id, 'Barangay East Bajac-Bajac', 'Olongapo City', 'Zambales', true
FROM volunteers v WHERE v.email = 'volunteer2@weatherhub.ph'
ON CONFLICT (volunteer_id, barangay, municipality) DO NOTHING;

INSERT INTO volunteer_areas (volunteer_id, barangay, municipality, province, is_active)
SELECT v.id, 'Barangay West Bajac-Bajac', 'Olongapo City', 'Zambales', true
FROM volunteers v WHERE v.email = 'volunteer3@weatherhub.ph'
ON CONFLICT (volunteer_id, barangay, municipality) DO NOTHING;
