-- New separate table for volunteer accounts
-- Create volunteers table for volunteer authentication
CREATE TABLE IF NOT EXISTS volunteers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  barangay VARCHAR(255),
  municipality VARCHAR(255) DEFAULT 'Olongapo City',
  province VARCHAR(255) DEFAULT 'Zambales',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON volunteers(email);
CREATE INDEX IF NOT EXISTS idx_volunteers_barangay ON volunteers(barangay);

-- Insert default volunteer users (password: volunteer123)
INSERT INTO volunteers (email, password, full_name, phone_number, barangay, municipality, province, is_active)
VALUES 
  ('volunteer1@weatherhub.ph', 'volunteer123', 'Maria Santos', '0917-123-4567', 'Barangay Barretto', 'Olongapo City', 'Zambales', true),
  ('volunteer2@weatherhub.ph', 'volunteer123', 'Juan Dela Cruz', '0918-234-5678', 'Barangay East Bajac-Bajac', 'Olongapo City', 'Zambales', true),
  ('volunteer3@weatherhub.ph', 'volunteer123', 'Ana Reyes', '0919-345-6789', 'Barangay West Bajac-Bajac', 'Olongapo City', 'Zambales', true)
ON CONFLICT (email) DO NOTHING;
