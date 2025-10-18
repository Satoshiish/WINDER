-- Add assigned_team_id column to emergency_reports table
ALTER TABLE emergency_reports 
ADD COLUMN IF NOT EXISTS assigned_team_id INTEGER REFERENCES response_teams(id) ON DELETE SET NULL;

-- Add deployment tracking columns
ALTER TABLE emergency_reports
ADD COLUMN IF NOT EXISTS deployment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'dispatched', 'on_scene', 'resolved'
ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Create index for team assignments
CREATE INDEX IF NOT EXISTS idx_emergency_reports_team ON emergency_reports(assigned_team_id);
