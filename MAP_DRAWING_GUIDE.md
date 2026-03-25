# Map Drawing Feature - Implementation Guide

## Overview

This implementation adds **advanced shape-based filtering** to your map screen, inspired by krisha.kz's drawing tools. Users can draw polygons, circles, and freehand shapes to define search areas and filter roommates by location.

## Features

### 1. **Polygon Drawing** (◈)
- Click on the map to place points
- Double-click to finish the polygon
- Minimum 3 points required
- Automatic closure of the shape

### 2. **Circle Drawing** (○)
- First click sets the center point
- Second click defines the radius
- Real-time radius visualization while dragging
- Customizable radius up to any distance

### 3. **Freehand Drawing** (✏)
- Click and drag to draw freely
- Minimum 3 points required
- Automatically closes the path to create a polygon
- Perfect for irregular areas

### 4. **Smart Filtering**
- Profiles are filtered to show only those inside **any** drawn area
- Multiple overlapping areas work with OR logic
- Real-time profile list updates
- Distance calculations remain functional

## Files Created

### 1. `MapDrawingController.jsx` (350 lines)
**Main logic handler for drawing operations**

```javascript
const MapDrawingController = ({ 
  allProfiles = [],
  onProfilesFiltered = () => {},
  drawingMode = null,
  onDrawingModeChange = () => {},
  drawnAreas = [],
  onAreasChange = () => {},
  onIsDrawingChange = () => {}
})
```

**Key Methods:**
- `startPolygonMode()` - Activate polygon drawing
- `startCircleMode()` - Activate circle drawing
- `startFreehandMode()` - Activate freehand drawing
- `removeArea(areaId)` - Delete specific drawn area
- `clearAllDrawings()` - Clear all areas
- `isPointInPolygon()` - Ray casting algorithm
- `isPointInCircle()` - Haversine distance check
- `filterProfilesByAreas()` - Apply filters

**Features:**
- Uses Leaflet.js for map integration
- Ray casting algorithm for polygon point-in-polygon detection
- Haversine formula for circle distance calculations
- Escape key cancels drawing mode
- Visual feedback during drawing

### 2. `MapDrawingControls.jsx` (280 lines)
**UI Component for drawing tool buttons**

```javascript
<MapDrawingControls
  drawingMode={drawingMode}
  isDrawing={isDrawing}
  drawnAreas={drawnAreas}
  onPolygonClick={() => {}}
  onCircleClick={() => {}}
  onFreehandClick={() => {}}
  onClearClick={() => {}}
  onRemoveArea={(areaId) => {}}
/>
```

**UI Features:**
- Bottom-center floating toolbar
- 3 drawing mode buttons (polygon, circle, freehand)
- Active state visualization
- Area badges showing all drawn shapes
- Individual area delete buttons (✕)
- "Clear All" button
- Drawing status indicator
- Fully responsive design

**Color Scheme:**
- Matcha green (#7A9E7E) for active states
- Light cream backgrounds
- Smooth transitions and hover effects
- Mobile-optimized layout

### 3. Modified `MapScreenAdvanced.jsx`
**Integration with existing map screen**

**New State:**
```javascript
const [drawnAreas, setDrawnAreas] = useState([]);
const [drawingMode, setDrawingMode] = useState(null);
const [isDrawing, setIsDrawing] = useState(false);
```

**New Component:**
```javascript
const InnerMapContent = () => {
  // Uses MapDrawingController to manage all drawing
  // Renders all map layers including drawn shapes
  // Integrates with existing markers and circles
}
```

**Integration Points:**
- Drawing happens within map context
- Controller has access to Leaflet map instance
- Filtered profiles update in real-time
- Works alongside existing radius search

## Usage Example

```jsx
// In App.js or wherever MapScreenAdvanced is used
<MapScreenAdvanced
  allProfiles={allProfiles}
  auth={auth}
  onSelectProfile={handleSelectProfile}
  liked={liked}
  onLike={handleLike}
  conversations={conversations}
  onSendMessage={handleSendMessage}
  setTab={setTab}
/>
```

## How It Works

### Drawing Flow

1. **User clicks drawing tool button** → `drawingMode` is set
2. **Drawing starts** → `isDrawing` set to true
3. **Map enters special input mode** → event listeners attached
4. **User creates shape** → points/radius collected
5. **User finishes** (double-click / second click / escape) → shape saved
6. **Filter applies automatically** → `filterProfilesByAreas()` runs
7. **Profile list updates** → only profiles in areas shown

### Point-in-Polygon Detection

Uses **ray casting algorithm**:
- Shoots horizontal ray from test point to infinity
- Counts intersections with polygon edges
- Odd count = inside, Even count = outside
- O(n) complexity, works for any polygon

```javascript
const isPointInPolygon = (point, polygonPoints) => {
  let inside = false;
  for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
    const intersect = ((yi > lng) !== (yj > lng))
      && (lat < ((xj - xi) * (lng - yi) / (yj - yi) + xi));
    if (intersect) inside = !inside;
  }
  return inside;
};
```

### Circle Distance Calculation

Uses **Haversine formula**:
- Calculates great-circle distance between two points
- Accounts for Earth's curvature
- Accurate to within 0.5% for normal distances

```javascript
const isPointInCircle = (point, center, radiusKm) => {
  const R = 6371; // Earth radius in km
  const a = Math.sin(dLat/2)**2 + 
    Math.cos(lat1*π/180) * Math.cos(lat2*π/180) * Math.sin(dLng/2)**2;
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return distance <= radiusKm;
};
```

## Architecture

```
MapScreenAdvanced
├── InnerMapContent (inside MapContainer)
│   ├── MapDrawingControllerSetup
│   │   └── useMap() → gets map instance
│   ├── TileLayer
│   ├── AutoZoomHandler
│   ├── RadiusAdjuster
│   ├── MapClickHandler
│   └── All map markers/circles
│
└── MapDrawingControls (outside MapContainer)
    └── UI buttons + area badges
```

**Data Flow:**
```
User clicks button
    ↓
MapDrawingControls → window.__mapDrawingController
    ↓
MapDrawingController.startPolygonMode()
    ↓
Map event listeners (click, mousemove, dblclick)
    ↓
Shape creation → area added to drawnAreas[]
    ↓
filterProfilesByAreas()
    ↓
setFilteredPeople() + sidebar updates
```

## Customization

### Change drawing colors:
```javascript
// In MapDrawingController.jsx
const polygonShape = L.polygon(polylinePointsRef.current, {
  color: '#YOUR_COLOR',      // Border color
  fillColor: '#YOUR_FILL',   // Fill color
  fillOpacity: 0.3,
  weight: 2
});
```

### Adjust button styling:
```javascript
// In MapDrawingControls.jsx
.drawing-tool-btn {
  width: 40px;  // Change size
  border-radius: 8px;  // Change shape
  // ... modify colors, shadows, etc.
}
```

### Add more drawing modes:
```javascript
// Add in MapDrawingController
const startRectangleMode = () => {
  // Implement rectangle drawing
  // Follow same pattern as polygon
};

// Add button in MapDrawingControls
<button onClick={onRectangleClick}>▭</button>
```

## Performance Notes

- **Ray Casting**: O(n) per profile, n = polygon vertices
  - For 100 profiles, 5 vertices: ~500 operations
  - Negligible impact

- **Memory**: Each area stores:
  - LatLng array: ~100 bytes per point
  - Leaflet layer: ~500 bytes
  - Typical: 2-5 KB per area

- **Map Rendering**: Uses Leaflet's native rendering
  - Optimized for thousands of markers
  - Drawing layers use SVG for smooth performance

## Browser Support

- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers (iOS Safari, Chrome Android)
- Touch events work for drawing
- Responsive design on all screen sizes

## Known Limitations

1. **Drawing cancellation**: User must press Escape or complete shape
2. **Concave polygons**: Ray casting works but may feel unintuitive
3. **Very large areas**: No performance degradation but visual clutter
4. **Undo**: Not implemented (could add history stack)

## Future Enhancements

- [ ] Undo/redo drawing history
- [ ] Save/load drawing areas
- [ ] Drawing area templates
- [ ] Heat maps showing profile density
- [ ] Polygon simplification for better performance
- [ ] Rectangle and other shape types
- [ ] Drawing snapping/alignment tools
- [ ] Export/share areas with others

## Testing

### Test polygon drawing:
1. Click polygon tool (◈)
2. Click 3+ points on map
3. Double-click to finish
4. Verify profiles inside appear

### Test circle drawing:
1. Click circle tool (○)
2. Click to set center
3. Click again to set radius
4. Verify circular filtering works

### Test freehand:
1. Click freehand tool (✏)
2. Drag to draw shape
3. Release to finish
4. Verify profiles inside appear

### Test multiple areas:
1. Draw 2-3 overlapping areas
2. Verify profile shows if in ANY area (OR logic)
3. Remove individual areas
4. Verify filtering updates

## Troubleshooting

**Drawing not working:**
- Check map has focus (click on it first)
- Verify `window.__mapDrawingController` is defined
- Check console for errors

**Profiles not filtering:**
- Ensure profiles have `latitude` and `longitude` fields
- Check drawn area is correct size/shape
- Try clearing and redrawing

**Performance issues:**
- Reduce polygon complexity (fewer vertices)
- Clear old areas not in use
- Check browser DevTools Performance tab

## Code Quality

- ✅ No external dependencies beyond Leaflet
- ✅ Pure functions where possible
- ✅ Clear variable naming
- ✅ Comprehensive comments
- ✅ Error handling for edge cases
- ✅ Responsive design
- ✅ Accessible UI (keyboard support)

## Credits

Inspired by krisha.kz's advanced map search with shape drawing. Implemented using Leaflet.js and React hooks for maximum compatibility and performance.
