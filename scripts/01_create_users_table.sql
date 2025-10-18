-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'volunteer', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password, full_name, role, is_active)
VALUES ('admin@weather.ph', 'admin123', 'System Administrator', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample volunteer users
INSERT INTO users (email, password, full_name, role, is_active)
VALUES 
  ('volunteer1@weather.ph', 'volunteer123', 'Maria Santos', 'volunteer', true),
  ('volunteer2@weather.ph', 'volunteer123', 'Juan Dela Cruz', 'volunteer', true)
ON CONFLICT (email) DO NOTHING;
