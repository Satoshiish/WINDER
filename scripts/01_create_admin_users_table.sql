-- Renamed from users table to admin_users table for clarity
-- Create admin_users table for admin authentication only
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (email, password, full_name, is_active)
VALUES ('admin@weatherhub.ph', 'admin123', 'System Administrator', true)
ON CONFLICT (email) DO NOTHING;
