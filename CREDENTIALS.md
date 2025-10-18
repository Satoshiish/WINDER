# WeatherHub Login Credentials

## Database Structure

The system uses three separate tables for authentication:
- **users** - For administrator accounts (with role='admin')
- **volunteers** - For volunteer field workers
- **responders** - For emergency response teams

## Admin Access

**Login URL**: `/login`

| Email | Password | Name | Access Level |
|-------|----------|------|--------------|
| admin@weather.ph | admin123 | System Administrator | Full system access |

**Permissions**:
- User management
- Emergency management
- Location management
- System settings
- View all volunteer updates

---

## Volunteer Access

**Login URL**: `/volunteer-login`

| Email | Password | Name | Assigned Area | Phone |
|-------|----------|------|---------------|-------|
| volunteer1@weatherhub.ph | volunteer123 | Maria Santos | Barangay Barretto | 0917-123-4567 |
| volunteer2@weatherhub.ph | volunteer123 | Juan Dela Cruz | Barangay East Bajac-Bajac | 0918-234-5678 |
| volunteer3@weatherhub.ph | volunteer123 | Ana Reyes | Barangay West Bajac-Bajac | 0919-345-6789 |

**Permissions**:
- Post weather updates for assigned areas
- Report field conditions
- View emergency alerts
- Update incident status
- Access volunteer dashboard

---

## Responder Access

**Login URL**: `/responder-login`

| Email | Password | Name | Team | Phone |
|-------|----------|------|------|-------|
| alpha.lead@emergency.ph | responder123 | Carlos Mendoza | Emergency Team Alpha | 0920-111-2222 |
| bravo.lead@emergency.ph | responder123 | Sofia Reyes | Emergency Team Bravo | 0921-222-3333 |
| fire1.captain@fire.ph | responder123 | Miguel Torres | Fire Department Unit 1 | 0922-333-4444 |
| fire2.captain@fire.ph | responder123 | Elena Cruz | Fire Department Unit 2 | 0923-444-5555 |
| fire3.captain@fire.ph | responder123 | Ramon Santos | Fire Department Unit 3 | 0924-555-6666 |
| medical.lead@medical.ph | responder123 | Dr. Lisa Garcia | Medical Response Team | 0925-666-7777 |
| rescue.alpha@rescue.ph | responder123 | Pedro Alvarez | Rescue Team Alpha | 0926-777-8888 |
| rescue.bravo@rescue.ph | responder123 | Maria Lopez | Rescue Team Bravo | 0927-888-9999 |
| police1.chief@police.ph | responder123 | Chief Roberto Diaz | Police Unit 1 | 0928-999-0000 |
| police2.chief@police.ph | responder123 | Chief Angela Ramos | Police Unit 2 | 0929-000-1111 |

**Permissions**:
- View assigned emergency reports
- Update deployment status (dispatched, en_route, on_scene, resolved)
- Add response notes
- Navigate to emergency locations
- Track team deployment history
- View emergency details and priority levels

---

## Database Tables

### users
\`\`\`sql
- id (SERIAL PRIMARY KEY)
- email (VARCHAR UNIQUE)
- password (VARCHAR)
- full_name (VARCHAR)
- role (VARCHAR: 'admin', 'user')
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
\`\`\`

### volunteers
\`\`\`sql
- id (SERIAL PRIMARY KEY)
- email (VARCHAR UNIQUE)
- password (VARCHAR)
- full_name (VARCHAR)
- phone_number (VARCHAR)
- barangay (VARCHAR)
- municipality (VARCHAR)
- province (VARCHAR)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
\`\`\`

### volunteer_areas
\`\`\`sql
- id (SERIAL PRIMARY KEY)
- volunteer_id (INTEGER REFERENCES volunteers)
- barangay (VARCHAR)
- municipality (VARCHAR)
- province (VARCHAR)
- assigned_at (TIMESTAMP)
- is_active (BOOLEAN)
\`\`\`

### volunteer_updates
\`\`\`sql
- id (SERIAL PRIMARY KEY)
- volunteer_id (INTEGER REFERENCES volunteers)
- barangay (VARCHAR)
- municipality (VARCHAR)
- province (VARCHAR)
- update_type (VARCHAR: weather, flood, evacuation, damage, safety, other)
- severity (VARCHAR: low, moderate, high, critical)
- title (VARCHAR)
- description (TEXT)
- latitude (NUMERIC)
- longitude (NUMERIC)
- image_url (TEXT)
- status (VARCHAR: active, resolved, archived)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
\`\`\`

### responders
\`\`\`sql
- id (SERIAL PRIMARY KEY)
- email (VARCHAR UNIQUE)
- password (VARCHAR)
- full_name (VARCHAR)
- phone_number (VARCHAR)
- team_id (INTEGER REFERENCES response_teams)
- role (VARCHAR: team_lead, member, driver, medic, specialist)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
\`\`\`

### response_teams
\`\`\`sql
- id (SERIAL PRIMARY KEY)
- team_name (VARCHAR UNIQUE)
- team_type (VARCHAR: emergency, fire, medical, rescue, police)
- contact_number (VARCHAR)
- base_location (VARCHAR)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
\`\`\`

---

## Security Notes

⚠️ **Important**: These credentials are for development and testing only.

**For Production**:
1. Change all default passwords
2. Implement proper password hashing (bcrypt, argon2)
3. Add rate limiting for login attempts
4. Enable two-factor authentication
5. Use environment variables for sensitive data
6. Implement session management with secure tokens
7. Add audit logging for all authentication events

---

## Quick Test Login

**Admin**: admin@weather.ph / admin123  
**Volunteer**: volunteer1@weatherhub.ph / volunteer123  
**Responder**: alpha.lead@emergency.ph / responder123
