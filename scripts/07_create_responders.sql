-- Create responders table for rescue team members
CREATE TABLE IF NOT EXISTS responders (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  team_id INTEGER REFERENCES response_teams(id) ON DELETE SET NULL,
  role VARCHAR(50) DEFAULT 'responder', -- 'responder', 'team_leader'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_responders_email ON responders(email);
CREATE INDEX IF NOT EXISTS idx_responders_team_id ON responders(team_id);
