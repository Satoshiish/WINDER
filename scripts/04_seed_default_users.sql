-- Seed default users for testing
-- Admin user
INSERT INTO users (email, password, role, full_name, phone, created_at)
VALUES (
  'admin@weatherhub.com',
  'admin123',
  'admin',
  'System Administrator',
  '+63 917 123 4567',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Volunteer users
INSERT INTO users (email, password, role, full_name, phone, created_at)
VALUES 
(
  'volunteer1@weatherhub.com',
  'volunteer123',
  'volunteer',
  'Juan Dela Cruz',
  '+63 917 234 5678',
  NOW()
),
(
  'volunteer2@weatherhub.com',
  'volunteer123',
  'volunteer',
  'Maria Santos',
  '+63 917 345 6789',
  NOW()
),
(
  'volunteer3@weatherhub.com',
  'volunteer123',
  'volunteer',
  'Pedro Reyes',
  '+63 917 456 7890',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Assign volunteers to areas
INSERT INTO volunteer_areas (volunteer_id, barangay_name, assigned_at)
SELECT 
  u.id,
  'Barangay East Bajac-Bajac',
  NOW()
FROM users u
WHERE u.email = 'volunteer1@weatherhub.com'
ON CONFLICT (volunteer_id, barangay_name) DO NOTHING;

INSERT INTO volunteer_areas (volunteer_id, barangay_name, assigned_at)
SELECT 
  u.id,
  'Barangay West Bajac-Bajac',
  NOW()
FROM users u
WHERE u.email = 'volunteer2@weatherhub.com'
ON CONFLICT (volunteer_id, barangay_name) DO NOTHING;

INSERT INTO volunteer_areas (volunteer_id, barangay_name, assigned_at)
SELECT 
  u.id,
  'Barangay New Cabalan',
  NOW()
FROM users u
WHERE u.email = 'volunteer3@weatherhub.com'
ON CONFLICT (volunteer_id, barangay_name) DO NOTHING;
