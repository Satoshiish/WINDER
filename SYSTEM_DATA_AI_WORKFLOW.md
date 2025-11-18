# WINDER+ System: Complete Data & AI Workflow

## System Overview
WINDER+ is an AI-powered weather monitoring and emergency response system for the Philippines. It integrates real-time weather data, ML-generated risk predictions, community reports, and emergency response coordination.

---

## 1. DATA SOURCES

### 1.1 Weather Data Sources
- **Open-Meteo API** - Real-time weather data
  - Temperature, humidity, wind speed, precipitation
  - Hourly and forecast data (up to 3 days)
  - Cloud cover, surface pressure, weather codes
  - Timezone: Asia/Manila

- **Earthquake Data** - Real-time seismic information
  - USGS Earthquake API integration
  - Magnitude, depth, location, time

- **Localized Data** - Philippine-specific locations
  - Provinces, cities, barangays
  - Geographic coordinates (lat/lon)
  - Administrative boundaries

---

## 2. API ENDPOINTS & PURPOSE

| API Endpoint | Purpose | Input | Output |
|---|---|---|---|
| `/api/weather/current` | Fetches real-time weather data | lat, lon | Temperature, condition, humidity, wind speed, feels-like temp |
| `/api/weather/alerts` | Fetches AI-based alerts & risk predictions | lat, lon | Alerts, Risk Predictions, Weather Indices, Earthquake Data |
| `/api/weather/forecast` | Fetches 7-day weather forecast | lat, lon | Hourly/daily forecast with conditions |
| `/api/weather/earthquakes` | Fetches earthquake data | lat, lon | Recent earthquakes within 300km radius |
| `/api/emergency` | Handles emergency reports | Report data | Save/retrieve emergency requests |
| `/api/rescue/alert` | Sends user's geotagged emergency request | User location, emergency type | Status confirmation, rescue team notification |
| `/api/community/report` | Submits verified local incident reports | Report details, location, type | Community report saved to database |
| `/api/notifications/send` | Sends push notifications to users | lat, lon, subscription | Push notification payload |

---

## 3. AI/ML WORKFLOW - RISK PREDICTION ENGINE

### 3.1 Risk Categories Calculated

#### A. **Flood Risk**
```
Formula: Based on rainfall intensity, humidity, pressure, and temperature
- Max Precipitation > 15mm → rainfallRisk = 40 + (maxPrecip × 2.5) + (avgPrecip × 1.5)
- If temp > 30°C AND humidity > 75% → +20% additional risk
- floodRisk = rainfallRisk × 0.85 + (precipitation trend > 0 ? 10% : 0%)
Output: 0-100% risk score
```

#### B. **Wind Risk**
```
Formula: Based on maximum and average wind speeds
- Max Wind > 40 km/h → windRisk = maxSpeed × 1.8 + (avgSpeed > 25 ? 15 : 0)
- Avg Wind > 20 km/h → windRisk = avgSpeed × 2.2
Output: 0-100% risk score
```

#### C. **Landslide Risk**
```
Formula: Multi-factor analysis
- soilSaturationFactor = avgPrecip > 10 ? 1.5 : avgPrecip > 5 ? 1.2 : 1.0
- pressureFactor = pressure < 1005 ? 1.3 : pressure < 1010 ? 1.1 : 1.0
- temperatureFactor = tempTrend < -3 ? 1.2 : 1.0
- landslideRisk = rainfallRisk × 0.7 × soilSaturation × pressure × temperature
Output: 0-100% risk score
```

#### D. **Earthquake Risk**
```
Formula: Based on recent seismic activity
- Fetches recent earthquakes (magnitude ≥ 4.5) within 300km radius
- Considers earthquakes from past 24 hours
- Analyzes distance to user location
Output: Binary (present/absent) + Magnitude severity
```

### 3.2 Risk Trend Analysis
Each risk category includes trend tracking:
- **"increasing"** - Risk values rising in next 24 hours
- **"decreasing"** - Risk values falling
- **"stable"** - No significant change

---

## 4. WEATHER INDICES (Advanced AI Metrics)

### 4.1 Heat Index
```
Calculation: Based on temperature & humidity
- Safe (HI < 27°C) - Green
- Caution (27-32°C) - Yellow
- Extreme Caution (32-41°C) - Orange
- Danger (41-54°C) - Red
- Extreme Danger (>54°C) - Maroon
Advisory: Heat stroke/exhaustion warnings
```

### 4.2 UV Index
```
Calculation: Cloud cover & latitude-based
- Low (0-2) - Green
- Moderate (3-5) - Yellow
- High (6-7) - Orange
- Very High (8-10) - Red
- Extreme (11+) - Maroon
Advisory: Skin protection recommendations
```

### 4.3 Typhoon Impact Index
```
Calculation: Multi-parameter analysis
Input Parameters:
- Hourly temperature data
- Humidity levels
- Wind speeds
- Precipitation rates
- Atmospheric pressure
- Cloud cover

Output Categories:
- None (Green)
- Minimal (Yellow)
- Moderate (Orange)
- High (Red)
- Extreme (Maroon)
Typhoon Levels: 1-5 scale
```

---

## 5. ALERT GENERATION SYSTEM

### 5.1 Automatic Alert Generation
System generates alerts when conditions exceed thresholds:

#### Heavy Rainfall Warning
```
Condition: Precipitation > 20mm/hr
Severity: HIGH (20-50mm) | EXTREME (>50mm)
Duration: 24 hours
Impact: Potential flooding, road hazards
```

#### Strong Wind Warning
```
Condition: Wind Speed > 60 km/h
Severity: HIGH (60-100 km/h) | EXTREME (>100 km/h)
Duration: 12 hours
Impact: Structure damage, travel hazards
```

#### Heat Index Warning
```
Condition: Temperature > 35°C
Severity: MODERATE (35-40°C) | EXTREME (>40°C)
Duration: 8 hours
Impact: Heat stroke risk, outdoor activity warnings
```

#### Earthquake Alert
```
Condition: Magnitude ≥ 4.5 within 300km
Severity: MODERATE (4.5-5.5) | HIGH (5.5-6.0) | EXTREME (≥6.0)
Duration: 24 hours
Impact: Aftershock potential, structural safety
```

### 5.2 Alert Severity Levels
- **EXTREME** - Immediate action required
- **HIGH** - Take precautions
- **MODERATE** - Be aware
- **LOW** - Monitor situation

---

## 6. EMERGENCY RESPONSE WORKFLOW

```
User Reports Emergency
        ↓
Geotagged Location Captured
        ↓
Emergency Type Classification
├─ Flood/Landslide
├─ Medical Emergency
├─ Road Accident
├─ Structural Collapse
└─ Other
        ↓
Priority Assignment (Critical/High/Medium/Low)
        ↓
Saved to Supabase Database
        ↓
Nearest Rescue Teams Notified (SMS/Push)
        ↓
Admin Dashboard Displays Report
        ↓
Responder Assigned & Route Provided
        ↓
Real-Time Status Tracking (Pending→In Progress→Resolved)
```

### 6.1 Emergency Report Data Structure
```json
{
  "id": "unique_report_id",
  "userId": "reporter_user_id",
  "userName": "Reporter Name",
  "contactNumber": "+63...",
  "emergencyType": "flood|accident|medical|structural|other",
  "priority": "critical|high|medium|low",
  "peopleCount": 0,
  "address": "Location Address",
  "location": {
    "lat": 14.8436,
    "lng": 120.3089
  },
  "additionalInfo": "Details",
  "status": "pending|in-progress|resolved|cancelled",
  "timestamp": "ISO_8601_datetime",
  "riskPredictions": [array of risk data],
  "assignedTo": "responder_id",
  "assigned_team_id": "team_id"
}
```

---

## 7. NOTIFICATION SYSTEM

### 7.1 Push Notifications
- **Trigger**: Alert severity or risk threshold breach
- **Delivery**: Web push, browser notifications, SMS
- **Content**: Location, risk type, recommendation
- **Frequency**: Real-time for critical alerts

### 7.2 SMS Formatting
Three types of SMS messages:

#### Weather Update SMS
```
WINDER+ Weather Update - [Location]
Temperature: [temp]°C (feels like [feelsLike]°C)
Condition: [weather condition]
Humidity: [%]
Wind Speed: [km/h]
Status: [description]
```

#### Risk Assessment SMS
```
WINDER+ Risk Assessment - [Location]
Flood Risk: [%] - [description]
Wind Risk: [%] - [description]
Landslide Risk: [%] - [description]
Earthquake Risk: [status] - [description]
Stay prepared and monitor updates regularly.
```

#### Emergency Alert SMS
```
WINDER+ [SEVERITY] ALERT - [Location]
Type: [alert type]
Title: [alert title]
Description: [alert description]
Affected Areas: [area list]
Take appropriate precautions immediately.
```

---

## 8. COMMUNITY REPORTING SYSTEM

### 8.1 Report Types
- **Flood** - Water level/inundation reports
- **Landslide** - Soil/debris movement
- **Blocked Roads** - Traffic/access issues
- **Power Outage** - Electricity disruptions
- **Other** - Custom incident types

### 8.2 Report Severity Levels
- **Low** - Minor inconvenience
- **Moderate** - Significant impact
- **High** - Serious threat

### 8.3 Report Verification
- Community crowdsourcing (upvotes/verification)
- Admin manual verification
- Location-based clustering (similar reports grouped)
- Time-based verification (old unverified reports archived)

---

## 9. DATA FLOW ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    USER APPLICATIONS                         │
│  (Dashboard, Mobile, Social Feed, Admin Panel)              │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
┌──────────────────┐  ┌──────────────────┐
│  Geolocation     │  │  User Input      │
│  (GPS/Browser)   │  │  (Settings/Prefs)│
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         └──────────┬──────────┘
                    ↓
        ┌─────────────────────────┐
        │   API ENDPOINTS         │
        │  (Next.js Route Handler)│
        └────────────┬────────────┘
                     │
         ┌───────────┼───────────┐
         ↓           ↓           ↓
    ┌─────────┐ ┌─────────┐ ┌──────────┐
    │ Weather │ │Emergency│ │Community │
    │  APIs   │ │Database │ │ Reports  │
    └────┬────┘ └────┬────┘ └──────┬───┘
         │           │             │
         ↓           ↓             ↓
    ┌─────────────────────────────────┐
    │   ML RISK PREDICTION ENGINE      │
    │  (Rainfall, Flood, Wind,        │
    │   Landslide, Earthquake)        │
    └────────────┬────────────────────┘
                 │
         ┌───────┴───────┐
         ↓               ↓
    ┌──────────┐   ┌──────────────┐
    │ Alerts   │   │ Notifications│
    │ Storage  │   │ (Push/SMS)   │
    └──────────┘   └──────────────┘
```

---

## 10. TECHNOLOGY STACK

### Frontend
- **Framework**: Next.js 16 with React 18
- **UI Components**: Radix UI, Shadcn/UI
- **Styling**: Tailwind CSS
- **Maps**: Leaflet/Map API
- **Charts**: Recharts
- **Notifications**: Sonner Toast

### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **APIs**: Open-Meteo, USGS Earthquake API
- **Notifications**: AWS SNS for SMS

### Deployment
- **Hosting**: Vercel (Next.js optimized)
- **Database**: Supabase Cloud
- **CDN**: Vercel Edge Network

---

## 11. KEY FEATURES EXPLAINED

### 11.1 Live Weather Monitoring
- Real-time weather updates every 5-15 minutes
- Automatic notifications on weather changes
- Location-based weather following user movement
- Search functionality for specific locations

### 11.2 Predictive Risk Analysis
- 48-hour ML-based risk predictions
- Multi-factor analysis (rainfall, wind, soil saturation, seismic activity)
- Trend detection (increasing/decreasing/stable)
- Severity classification with color coding

### 11.3 Emergency Response Coordination
- Real-time emergency report submission
- Geotagged location capture
- Automatic team assignment
- Live response tracking
- Admin dashboard for dispatching

### 11.4 Community Intelligence
- User-submitted hazard reports
- Location-based clustering
- Community verification voting
- Multi-language support (English/Filipino)

### 11.5 Multi-Channel Notifications
- Push notifications (web)
- Browser notifications
- SMS alerts (AWS SNS)
- In-app toast notifications
- Email alerts (optional)

---

## 12. DATA SECURITY & PRIVACY

- **Authentication**: Supabase JWT tokens
- **Authorization**: Role-based access control (User/Responder/Admin)
- **Data Encryption**: HTTPS/TLS for all communications
- **Location Privacy**: Optional location sharing
- **Data Retention**: Automated cleanup of old reports
- **GDPR Compliance**: User consent for data collection

---

## 13. PERFORMANCE OPTIMIZATION

- **Caching**: API response caching for weather data
- **Lazy Loading**: Components load on demand
- **Progressive Web App**: Offline functionality
- **Compression**: Gzip compression for all responses
- **Database Indexing**: Optimized queries on lat/lon coordinates
- **Rate Limiting**: API rate limiting to prevent abuse

---

## 14. MACHINE LEARNING MODEL PARAMETERS

### Risk Prediction Weights
```javascript
Rainfall Risk = 40 + (maxPrecip × 2.5) + (avgPrecip × 1.5)
                + (temp > 30 & humidity > 75 ? 20 : 0)

Flood Risk = Rainfall Risk × 0.85 + (trend > 0 ? 10 : 0)

Wind Risk = maxSpeed × 1.8 + (avgSpeed > 25 ? 15 : 0)

Landslide Risk = Rainfall Risk × 0.7 × soilSaturation × pressure × temperature

Earthquake Risk = Magnitude-based severity + Distance-based impact
```

### Input Data Points (48-hour window)
- Temperature (current + hourly)
- Precipitation (current + hourly)
- Wind speed (current + hourly)
- Humidity levels
- Atmospheric pressure
- Cloud cover
- Seismic data (last 24 hours)

---

## 15. SYSTEM FLOW EXAMPLE

### Scenario: User in Metro Manila During Typhoon

```
1. User opens WINDER+ app
   ↓
2. Geolocation captures: (14.5995°N, 120.9842°E)
   ↓
3. System fetches:
   - Current weather (31°C, 85% humidity, 45 km/h winds)
   - Forecast data (next 72 hours)
   - Earthquake data (recent seismic activity)
   ↓
4. ML Engine calculates risks:
   - Rainfall Risk: 72% (HIGH)
   - Flood Risk: 68% (HIGH) → Trend: INCREASING ↑
   - Wind Risk: 58% (HIGH)
   - Landslide Risk: 45% (MODERATE)
   - Earthquake Risk: STABLE
   ↓
5. System generates alerts:
   - "Heavy Rainfall Warning" (Severity: HIGH)
   - "High Flood Risk in Low-Lying Areas"
   ↓
6. Heat Index calculated: 38°C (EXTREME CAUTION)
   UV Index calculated: 6 (HIGH)
   Typhoon Impact Index: 4 (HIGH)
   ↓
7. Notifications sent:
   - Push: "⚠️ High Risk Alert - Metro Manila"
   - SMS: "WINDER+ ALERT - Heavy rainfall with flooding risk expected"
   ↓
8. Dashboard displays:
   - Live weather card with current conditions
   - Risk prediction cards with trends
   - Community reports from area (flooding reports)
   - Evacuation map showing safe zones
   ↓
9. User can:
   - Report emergency → Location captured → Sent to rescue teams
   - Submit community report → Shared with others
   - View evacuation routes
   - Enable SMS notifications
```

---

## 16. INTEGRATION POINTS

### External API Dependencies
1. **Open-Meteo Weather API** - Weather data
2. **USGS Earthquake API** - Seismic data
3. **AWS SNS** - SMS delivery
4. **Browser Geolocation API** - User location
5. **Web Push API** - Push notifications

### Internal Database Tables (Supabase)
- `emergency_reports` - Emergency submissions
- `volunteers` - Volunteer responders
- `responders` - Professional responders
- `response_teams` - Team assignments
- `social_posts` - Community posts
- `social_comments` - Post comments
- `social_likes` - Post engagement
- `social_followers` - Social network

---

## 17. METRICS & MONITORING

### System Health Metrics
- API response time (target: <500ms)
- Alert generation latency (target: <2s)
- Database query performance
- Push notification delivery rate
- User engagement metrics

### Business Metrics
- Active users
- Emergency reports processed
- Community reports submitted
- Alert accuracy rate
- Evacuation success rate

---

## Summary Table: Complete Data & AI Workflow

| Component | Input | Process | Output |
|-----------|-------|---------|--------|
| **Weather Module** | Open-Meteo API | Fetch current & forecast data | Temperature, humidity, wind, conditions |
| **Risk Engine** | Weather data | ML algorithms | 4 risk scores (Rainfall, Flood, Wind, Landslide) |
| **Earthquake Module** | USGS API | Seismic analysis | Earthquake alerts & magnitude |
| **Alert System** | Risk scores + weather | Threshold comparison | Alert objects with severity |
| **Weather Indices** | Current conditions | Index calculations | Heat Index, UV, Typhoon Impact |
| **Emergency Module** | User submission | Location capture + DB save | Rescue team notification |
| **Community Reports** | User input | Verification + clustering | Public feed + community intelligence |
| **Notification Engine** | Alerts + reports | Template formatting | Push notifications + SMS |
| **Dashboard** | All data sources | Real-time aggregation | User-facing UI with maps & charts |

---

**System Version**: WINDER+ v1.0
**Last Updated**: November 2025
**Architecture**: AI-Powered Disaster Risk Reduction Platform for the Philippines
