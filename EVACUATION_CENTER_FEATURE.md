# Nearest Evacuation Center Feature

## Overview
The evacuation map has been enhanced to prioritize showing the **nearest evacuation center** based on the user's device location. The system now uses OpenStreetMap (OSM) with interactive mapping via Leaflet to provide real-time distance calculations and visual routing.

## Key Features

### 1. **Distance Calculation**
- **Algorithm**: Haversine formula for accurate great-circle distance between two coordinates
- **Automatic Sorting**: All evacuation centers are sorted by proximity (nearest first) to the user's location
- **Real-time Updates**: Distance recalculates whenever the user's location changes

### 2. **Prominent Display**
The nearest evacuation center is now displayed in a dedicated card at the top of the evacuation map with:
- **Center Name & Address** with exact coordinates
- **Interactive OpenStreetMap** showing:
  - User's current location (blue circle marker)
  - Nearest center (red emergency marker)
  - Both locations visible in a single map view
- **Capacity Information**:
  - Total capacity vs. current occupancy
  - Visual occupancy bar (green/yellow/red)
  - Percentage full indicator
- **Contact Information**: Clickable phone number for emergency contact
- **Facilities List**: Medical, Food, Shelter, Sanitation, etc.
- **Other Nearby Centers**: Secondary list showing the next closest options

### 3. **OpenStreetMap Integration**
- **Library**: React-Leaflet with Leaflet.js
- **Tile Provider**: OpenStreetMap contributors
- **Features**:
  - Fully interactive map with zoom and pan controls
  - Custom icons for user location and evacuation centers
  - Popup information on marker click
  - Auto-fit view to show both user and nearest center

### 4. **Backend Changes**

#### `services/evacuationService.ts`
```typescript
// New Haversine distance calculation function
function calculateHaversineDistance(lat1, lon1, lat2, lon2): number
// Returns distance in kilometers

// Updated getEvacuationDataForLocation()
// Now automatically:
// 1. Calculates distance for each flood zone
// 2. Calculates distance for each evacuation center
// 3. Sorts evacuation centers by distance (nearest first)
// 4. Logs nearest center details to console
```

#### Backend API (`/api/evacuation`)
- No changes to API contract
- Backend returns sorted data from service
- Frontend consumes pre-sorted evacuation centers

### 5. **Component Architecture**

#### `components/evacuation-center-map.tsx` (New)
- React client component with Leaflet map
- Props:
  - `userLat`, `userLon`: User's coordinates
  - `nearestCenter`: Details of the nearest center
- Features:
  - SSR-safe (dynamic import only)
  - Responsive design
  - Auto-fit map bounds

#### `components/evacuation-map.tsx` (Modified)
- Added dynamic import for the map component
- New state tracking for nearest center display
- Prominent card section at top showing:
  - Nearest center details
  - Interactive OSM map
  - Secondary nearby centers list
- Maintains all existing functionality:
  - Risk assessment
  - Flood zone display
  - Evacuation routes
  - Zone detail view

## Installation & Dependencies

### Required Packages
```bash
npm install leaflet react-leaflet --legacy-peer-deps
```

### Package Versions
- `leaflet`: Latest stable
- `react-leaflet`: v5.0.0+ (requires React 19, installed with legacy-peer-deps)

### CSS
- Leaflet CSS is imported in the map component automatically
- Tailwind classes are used for styling

## Usage

### Basic Usage
The evacuation map component automatically detects user location and displays the nearest center:

```tsx
import { EvacuationMap } from "@/components/evacuation-map"

export default function EvacuationPage() {
  return <EvacuationMap />
}
```

### With Explicit Coordinates
```tsx
<EvacuationMap 
  userLat={14.5994}
  userLon={120.9842}
/>
```

## Data Flow

```
User Location (Geolocation API or Props)
    ↓
[API] GET /api/evacuation?lat={lat}&lng={lng}
    ↓
[Service] getEvacuationDataForLocation()
    ↓
Calculate Haversine distance for each center
    ↓
Sort centers by distance
    ↓
Return sorted data to frontend
    ↓
[Component] Display nearest center prominently
    ↓
[Map] Render interactive OSM with both locations
```

## Distance Calculation Formula

The Haversine formula calculates the shortest distance between two points on Earth:

```
R = 6371 km (Earth's radius)
dLat = (lat2 - lat1) * π/180
dLon = (lon2 - lon1) * π/180
a = sin²(dLat/2) + cos(lat1*π/180) * cos(lat2*π/180) * sin²(dLon/2)
c = 2 * atan2(√a, √(1-a))
distance = R * c
```

**Accuracy**: ±0.5% for normal distances, suitable for evacuation planning

## Database Schema Expectations

### `evacuation_centers` table
```sql
- id: string/uuid (PRIMARY KEY)
- name: string
- capacity: integer
- current_occupancy: integer
- latitude: number (float/decimal)
- longitude: number (float/decimal)
- address: string
- contact: string (phone number)
- facilities: json array
- city: string (for filtering)
- created_at: timestamp
- updated_at: timestamp
```

### `flood_zones` table
```sql
- id: string/uuid
- name: string
- risk_level: enum ('high', 'medium', 'low')
- area: string
- affected_population: integer
- latitude: number
- longitude: number
- city: string
- created_at: timestamp
```

## Browser Compatibility

- **Modern browsers**: Full support
- **Location Services**: Requires HTTPS or localhost
- **User Permissions**: Geolocation access must be granted
- **Fallback**: Defaults to Manila coordinates if location unavailable

## Performance Considerations

1. **Distance Calculation**: O(n) where n = number of evacuation centers
   - Typically < 10ms for 100 centers on modern devices
2. **Map Rendering**: Lazy loaded with dynamic import
3. **Re-renders**: Only when location changes significantly
4. **Database**: Index on `(city, latitude, longitude)` recommended

## Error Handling

- Missing coordinates: Uses fallback location (14.5995, 120.9842)
- Geolocation blocked: Gracefully falls back to fallback location
- Empty evacuation centers list: Shows "No evacuation centers available"
- Map load failure: Displays loading skeleton

## Testing Checklist

- [ ] Verify nearest center displays correctly
- [ ] Check distance calculations against manual measurement
- [ ] Test map interaction (zoom, pan, click markers)
- [ ] Verify occupancy bar colors change correctly
- [ ] Test contact number is clickable
- [ ] Verify facilities list displays
- [ ] Check other nearby centers list
- [ ] Test with different locations
- [ ] Verify responsive design on mobile
- [ ] Test geolocation permission prompt

## Future Enhancements

1. **Routing**:
   - Integrate OpenRouteService for turn-by-turn directions
   - Calculate driving time vs. straight-line distance

2. **Real-time Updates**:
   - WebSocket integration for live occupancy updates
   - Evacuation center status changes

3. **Accessibility**:
   - Add audio cues for directions
   - Screen reader optimization

4. **Advanced Filtering**:
   - Filter by facilities (medical, food, etc.)
   - Filter by capacity availability
   - Filter by accessibility features

5. **Social Features**:
   - Share evacuation center location
   - Mark centers as visited
   - Leave feedback/reviews

## Troubleshooting

### Map not rendering
- Check if Leaflet CSS is imported
- Verify dynamic import syntax in Next.js
- Check browser console for errors

### Incorrect distances
- Verify latitude/longitude values in database
- Test Haversine calculation with known coordinates
- Check for coordinate ordering (lat, lon vs. lon, lat)

### Geolocation not working
- Ensure HTTPS connection (or localhost for development)
- Check user permissions in browser settings
- Verify `navigator.geolocation` availability

### Package conflicts
- Use `--legacy-peer-deps` when installing dependencies
- Ensure React 18.3.1 compatibility with react-leaflet

## References

- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)
- [OpenStreetMap](https://www.openstreetmap.org)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [React-Leaflet Documentation](https://react-leaflet.js.org/)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
