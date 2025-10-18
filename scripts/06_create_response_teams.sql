-- Create response_teams table to store different emergency response teams
CREATE TABLE IF NOT EXISTS response_teams (
  id SERIAL PRIMARY KEY,
  team_name VARCHAR(255) NOT NULL UNIQUE,
  team_type VARCHAR(100) NOT NULL, -- 'emergency', 'fire', 'medical', 'rescue', 'police'
  contact_number VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default response teams
INSERT INTO response_teams (team_name, team_type, contact_number) VALUES
  ('Emergency Team Alpha', 'emergency', '09171234567'),
  ('Emergency Team Bravo', 'emergency', '09171234568'),
  ('Fire Department Unit 1', 'fire', '09171234569'),
  ('Fire Department Unit 2', 'fire', '09171234570'),
  ('Fire Department Unit 3', 'fire', '09171234571'),
  ('Medical Response Team', 'medical', '09171234572'),
  ('Rescue Team Alpha', 'rescue', '09171234573'),
  ('Rescue Team Bravo', 'rescue', '09171234574'),
  ('Police Unit 1', 'police', '09171234575'),
  ('Police Unit 2', 'police', '09171234576')
ON CONFLICT (team_name) DO NOTHING;
