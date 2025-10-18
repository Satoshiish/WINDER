-- Seed default admin user in the existing users table
-- This script adds an admin account to the users table

INSERT INTO users (email, full_name, password, role, is_active, created_at, updated_at)
VALUES 
  ('admin@weather.ph', 'System Administrator', 'admin123', 'admin', true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE
SET 
  full_name = EXCLUDED.full_name,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
