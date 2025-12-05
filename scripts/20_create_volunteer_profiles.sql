-- Create table to store volunteer profile/resume metadata
CREATE TABLE IF NOT EXISTS volunteer_profiles (
  id serial PRIMARY KEY,
  volunteer_id integer NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  bio text,
  trainings text[],
  total_hours integer DEFAULT 0,
  certifications jsonb,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (volunteer_id)
);

-- Index for quick lookup by volunteer_id
CREATE INDEX IF NOT EXISTS idx_volunteer_profiles_volunteer_id ON volunteer_profiles (volunteer_id);
