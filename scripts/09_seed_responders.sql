-- Seed default responder accounts
-- Password for all: responder123

INSERT INTO responders (email, password, full_name, phone_number, team_id, role) VALUES
  ('alpha.lead@emergency.ph', 'responder123', 'John Alpha', '09171234580', 1, 'team_leader'),
  ('bravo.lead@emergency.ph', 'responder123', 'Maria Bravo', '09171234581', 2, 'team_leader'),
  ('fire1.lead@fire.ph', 'responder123', 'Pedro Cruz', '09171234582', 3, 'team_leader'),
  ('fire2.lead@fire.ph', 'responder123', 'Carlos Reyes', '09171234583', 4, 'team_leader'),
  ('fire3.lead@fire.ph', 'responder123', 'Ramon Santos', '09171234584', 5, 'team_leader'),
  ('medical.lead@medical.ph', 'responder123', 'Dr. Ana Garcia', '09171234585', 6, 'team_leader'),
  ('rescue.alpha@rescue.ph', 'responder123', 'Miguel Torres', '09171234586', 7, 'team_leader'),
  ('rescue.bravo@rescue.ph', 'responder123', 'Sofia Mendoza', '09171234587', 8, 'team_leader'),
  ('police1.lead@police.ph', 'responder123', 'Officer Juan Cruz', '09171234588', 9, 'team_leader'),
  ('police2.lead@police.ph', 'responder123', 'Officer Lisa Ramos', '09171234589', 10, 'team_leader')
ON CONFLICT (email) DO NOTHING;
