# Map Drawing - Code Examples & Usage

## Basic Usage (Already Integrated)

The drawing feature is **automatically integrated** into `MapScreenAdvanced`. No additional setup needed:

```jsx
import MapScreenAdvanced from './components/MapScreenAdvanced';

// In your App.js or wherever you render the map
<MapScreenAdvanced
  allProfiles={profiles}
  auth={currentUser}
  onSelectProfile={handleSelectProfile}
  liked={likedSet}
  onLike={handleLike}
  conversations={conversations}
  onSendMessage={handleSendMessage}
  setTab={setTab}
/>
```

That's it! The drawing tools will appear automatically.

## How Users Interact

### Example 1: Simple Polygon Drawing

```javascript
// User interaction (UI):
1. Click map tab
2. Click [◈] button (Polygon tool)
3. Click on map at: (43.22, 76.90) - Downtown
4. Click on map at: (43.23, 76.95)
5. Click on map at: (43.21, 76.95)
6. Double-click to finish

// Behind the scenes (code):
drawingMode = "polygon"
isDrawing = true

polylinePoints = [
  {lat: 43.22, lng: 76.90},
  {lat: 43.23, lng: 76.95},
  {lat: 43.21, lng: 76.95}
]

// Shape created and saved
drawnAreas = [{
  id: "polygon-1234567890",
  type: "polygon",
  latlngs: [...],
  layer: <Leaflet Polygon>
}]

// Filtering triggered
filteredPeople = profiles.filter(p => 
  isPointInPolygon(p, polylinePoints)
)

// Result: Sidebar shows only 2 profiles inside polygon
```

### Example 2: Circle Drawing for Search Area

```javascript
// User interaction:
1. Click [○] button (Circle tool)
2. Click on map: (43.25, 76.92) - Satpayev Station
3. Drag mouse outward... see circle expand
4. Click again when radius is 2 km

// Behind the scenes:
drawingMode = "circle"
isDrawing = true

circleCenterRef.current = {lat: 43.25, lng: 76.92}

// Real-time preview as mouse moves:
distance = map.distance(center, mouseLat/Lng) / 1000
circlePreview.setRadius(distance * 1000)

// On second click:
drawnAreas = [{
  id: "circle-1234567890",
  type: "circle",
  center: {lat: 43.25, lng: 76.92},
  radius: 2.0,
  layer: <Leaflet Circle>
}]

// Filtering triggered
filteredPeople = profiles.filter(p => 
  isPointInCircle(p, center, 2.0)
)

// Result: 5 profiles within 2km radius
```

### Example 3: Freehand Drawing

```javascript
// User interaction:
1. Click [✏] button (Freehand tool)
2. Click and drag from (43.20, 76.88) to (43.30, 77.00)
3. Draw irregular shape around west side
4. Release mouse when done

// Behind the scenes:
drawingMode = "freehand"
isDrawing = true

// As mouse moves:
pathPointsRef.current = [
  {lat: 43.20, lng: 76.88},  // start
  {lat: 43.21, lng: 76.89},
  {lat: 43.22, lng: 76.90},
  // ... hundreds of points ...
  {lat: 43.30, lng: 77.00},  // end
]

// Update preview line in real-time
pathPolylineRef.current = L.polyline(pathPoints, {
  color: '#7A9E7E',
  weight: 3,
  opacity: 0.8,
  dashArray: '2, 3'
}).addTo(map)

// On mouse release:
drawnAreas = [{
  id: "freehand-1234567890",
  type: "freehand",
  latlngs: pathPoints,
  layer: <Leaflet Polygon>
}]

// Filtering triggered
filteredPeople = profiles.filter(p => 
  isPointInPolygon(p, pathPoints)
)

// Result: 3 profiles in west side area
```

## Component Props

### MapDrawingControls Props

```javascript
<MapDrawingControls
  // Current drawing mode
  drawingMode={'polygon'}  // 'polygon' | 'circle' | 'freehand' | null
  
  // Is user actively drawing
  isDrawing={true}  // boolean
  
  // All drawn areas
  drawnAreas={[
    {
      id: "polygon-123",
      type: "polygon",
      latlngs: [{lat, lng}, ...],
      layer: leafletLayer,
      center: undefined,
      radius: undefined
    },
    {
      id: "circle-456",
      type: "circle",
      center: {lat: 43.25, lng: 76.92},
      radius: 2.5,
      latlngs: undefined,
      layer: leafletLayer
    }
  ]}
  
  // Callbacks
  onPolygonClick={() => {
    // Called when [◈] button clicked
    // Activates polygon drawing mode
  }}
  
  onCircleClick={() => {
    // Called when [○] button clicked
    // Activates circle drawing mode
  }}
  
  onFreehandClick={() => {
    // Called when [✏] button clicked
    // Activates freehand drawing mode
  }}
  
  onClearClick={() => {
    // Called when "Clear All" button clicked
    // Should clear all areas
  }}
  
  onRemoveArea={(areaId) => {
    // Called when ✕ clicked on an area badge
    // Should remove just that area
  }}
/>
```

### MapDrawingController Props

```javascript
// Called inside InnerMapContent within MapContainer context
const controller = MapDrawingController({
  // All user profiles to filter
  allProfiles: [
    {
      id: '1',
      name: 'Alice',
      latitude: 43.22,
      longitude: 76.91,
      age: 25,
      occupation: 'Designer',
      region: '2',
      tags: ['creative', 'coffee']
    },
    // ... more profiles
  ],
  
  // Called when profiles are filtered
  onProfilesFiltered: (filteredProfiles) => {
    console.log('Filtered:', filteredProfiles.length)
    // Update sidebar with new profile list
    setFilteredPeople(filteredProfiles)
  },
  
  // Current drawing mode from state
  drawingMode: null,  // 'polygon' | 'circle' | 'freehand' | null
  
  // Update drawing mode
  onDrawingModeChange: (mode) => {
    setDrawingMode(mode)
  },
  
  // All drawn areas from state
  drawnAreas: [],
  
  // Update drawn areas
  onAreasChange: (areas) => {
    setDrawnAreas(areas)
  },
  
  // Update drawing state
  onIsDrawingChange: (isDrawing) => {
    setIsDrawing(isDrawing)
  }
})

// Use the controller
controller.startPolygonMode()
controller.startCircleMode()
controller.startFreehandMode()
controller.removeArea('polygon-123')
controller.clearAllDrawings()
```

## Customization Examples

### Change Drawing Colors

```jsx
// In MapDrawingController.jsx, line ~120
const polygonShape = L.polygon(polylinePointsRef.current, {
  color: '#7A9E7E',      // Border color - CHANGE THIS
  weight: 2,
  opacity: 0.7,
  fillColor: '#E4F0E0',   // Fill color - CHANGE THIS
  fillOpacity: 0.3,
  interactive: true
}).addTo(map);
```

Example colors:
```javascript
// Matcha (current)
border: '#7A9E7E', fill: '#E4F0E0'

// Blue
border: '#4A90E2', fill: '#E8F4FF'

// Red
border: '#E74C3C', fill: '#FADBD8'

// Purple
border: '#9B59B6', fill: '#EBDEF0'

// Orange
border: '#E67E22', fill: '#FCE4CB'
```

### Add Rectangle Drawing Mode

```javascript
// In MapDrawingController.jsx
const startRectangleMode = () => {
  if (!map) return;
  onDrawingModeChange('rectangle');
  onIsDrawingChange(true);
  
  let rectPoints = [];
  
  const finishRectangle = (e) => {
    if (rectPoints.length !== 2) return;
    
    const bounds = L.latLngBounds(rectPoints);
    const rectangleShape = L.rectangle(bounds, {
      color: '#7A9E7E',
      weight: 2,
      opacity: 0.7,
      fillColor: '#E4F0E0',
      fillOpacity: 0.3
    }).addTo(map);
    
    drawnItemsRef.current.addLayer(rectangleShape);
    
    const newArea = {
      id: `rectangle-${Date.now()}`,
      type: 'rectangle',
      bounds: bounds,
      layer: rectangleShape
    };
    
    const updatedAreas = [...drawnAreas, newArea];
    onAreasChange(updatedAreas);
    filterProfilesByAreas(updatedAreas);
    
    // Cleanup...
  };
  
  map.once('click', (e) => {
    rectPoints.push(e.latlng);
  });
  map.once('click', (e) => {
    rectPoints.push(e.latlng);
    finishRectangle();
  });
};

// In MapDrawingControls.jsx, add button:
<button
  className={`drawing-tool-btn ${drawingMode === 'rectangle' ? 'active' : ''}`}
  onClick={onRectangleClick}
  disabled={isDrawing && drawingMode !== 'rectangle'}
  title="Draw Rectangle"
>
  ▭
</button>
```

### Change Filtering Logic (AND instead of OR)

```javascript
// In MapDrawingController.jsx, line ~65
// Current: OR logic (show if in ANY area)
const filterProfilesByAreas = (areas) => {
  if (areas.length === 0) {
    onProfilesFiltered([]);
    return;
  }

  const filtered = allProfiles.filter(profile => {
    if (!profile.latitude || !profile.longitude) return false;

    // CHANGE: From .some() to .every()
    return areas.every(area => {  // ← Changed from .some()
      if (area.type === 'polygon' || area.type === 'freehand') {
        return isPointInPolygon(profile, area.latlngs);
      } else if (area.type === 'circle') {
        return isPointInCircle(profile, area.center, area.radius);
      }
      return false;
    });
  });

  onProfilesFiltered(filtered);
};

// Now: Profile must be in ALL areas to show
// Before: Profile shows if in ANY area
```

### Add Undo/Redo Functionality

```javascript
// In MapScreenAdvanced.jsx
const [drawnAreas, setDrawnAreas] = useState([]);
const [undoStack, setUndoStack] = useState([]);  // NEW
const [redoStack, setRedoStack] = useState([]);  // NEW

// When adding an area:
const handleAreaAdded = (newAreas) => {
  setUndoStack([...undoStack, drawnAreas]);  // Save current state
  setRedoStack([]);  // Clear redo stack
  setDrawnAreas(newAreas);
};

// Undo function:
const handleUndo = () => {
  if (undoStack.length === 0) return;
  
  const previousState = undoStack[undoStack.length - 1];
  setRedoStack([...redoStack, drawnAreas]);
  setUndoStack(undoStack.slice(0, -1));
  setDrawnAreas(previousState);
};

// Redo function:
const handleRedo = () => {
  if (redoStack.length === 0) return;
  
  const nextState = redoStack[redoStack.length - 1];
  setUndoStack([...undoStack, drawnAreas]);
  setRedoStack(redoStack.slice(0, -1));
  setDrawnAreas(nextState);
};
```

### Save Areas to LocalStorage

```javascript
// In MapScreenAdvanced.jsx
const [drawnAreas, setDrawnAreas] = useState([]);

// Load on mount:
useEffect(() => {
  const saved = localStorage.getItem('drawnAreas');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      setDrawnAreas(parsed);
    } catch (e) {
      console.error('Failed to load areas:', e);
    }
  }
}, []);

// Save when changed:
useEffect(() => {
  // Don't save Leaflet layers (can't serialize)
  const toSave = drawnAreas.map(area => ({
    ...area,
    layer: undefined  // Remove layer object
  }));
  localStorage.setItem('drawnAreas', JSON.stringify(toSave));
}, [drawnAreas]);

// Load areas back (recreate layers):
const loadAreasFromStorage = (areas) => {
  areas.forEach(area => {
    if (area.type === 'polygon' || area.type === 'freehand') {
      const layer = L.polygon(area.latlngs, {...}).addTo(map);
      area.layer = layer;
    } else if (area.type === 'circle') {
      const layer = L.circle(area.center, area.radius * 1000, {...}).addTo(map);
      area.layer = layer;
    }
  });
};
```

### Add Area Statistics

```javascript
// In MapScreenAdvanced.jsx
const getAreaStats = (area) => {
  const profilesInArea = filteredPeople.filter(p => {
    if (area.type === 'polygon' || area.type === 'freehand') {
      return isPointInPolygon(p, area.latlngs);
    } else if (area.type === 'circle') {
      return isPointInCircle(p, area.center, area.radius);
    }
    return false;
  });
  
  const avgAge = profilesInArea.length > 0
    ? Math.round(profilesInArea.reduce((sum, p) => sum + p.age, 0) / profilesInArea.length)
    : 0;
  
  return {
    count: profilesInArea.length,
    avgAge: avgAge,
    profiles: profilesInArea
  };
};

// Display in badge:
<div className="area-badge">
  <span>{area.type === 'polygon' ? '◈' : area.type === 'circle' ? '○' : '✏'}</span>
  <span>{getAreaStats(area).count} people</span>
  <button onClick={() => removeArea(area.id)}>✕</button>
</div>
```

## Error Handling

### Catching Drawing Errors

```javascript
// In MapDrawingController.jsx
const startPolygonMode = () => {
  try {
    if (!map) {
      console.error('Map not initialized');
      return;
    }
    
    // ... drawing code ...
    
  } catch (error) {
    console.error('Error in polygon mode:', error);
    alert('Error while drawing. Please try again.');
    
    // Reset state
    onDrawingModeChange(null);
    onIsDrawingChange(false);
  }
};
```

### Validating Profile Data

```javascript
// In MapDrawingController.jsx
const filterProfilesByAreas = (areas) => {
  if (areas.length === 0) {
    onProfilesFiltered([]);
    return;
  }

  const filtered = allProfiles.filter(profile => {
    // Validate profile has coordinates
    if (
      !profile.latitude || 
      !profile.longitude || 
      typeof profile.latitude !== 'number' || 
      typeof profile.longitude !== 'number'
    ) {
      console.warn('Invalid profile coordinates:', profile.id);
      return false;
    }
    
    // ... rest of filtering
  });

  onProfilesFiltered(filtered);
};
```

## Testing Code

### Unit Test Example (Jest)

```javascript
// MapDrawingController.test.js
describe('MapDrawingController', () => {
  it('should detect point inside polygon', () => {
    const polygon = [
      {lat: 0, lng: 0},
      {lat: 0, lng: 2},
      {lat: 2, lng: 2},
      {lat: 2, lng: 0}
    ];
    
    const point = {latitude: 1, longitude: 1};
    const result = isPointInPolygon(point, polygon);
    
    expect(result).toBe(true);
  });
  
  it('should detect point outside polygon', () => {
    const polygon = [
      {lat: 0, lng: 0},
      {lat: 0, lng: 2},
      {lat: 2, lng: 2},
      {lat: 2, lng: 0}
    ];
    
    const point = {latitude: 3, longitude: 3};
    const result = isPointInPolygon(point, polygon);
    
    expect(result).toBe(false);
  });
  
  it('should detect point inside circle', () => {
    const center = {lat: 0, lng: 0};
    const point = {latitude: 0.01, longitude: 0.01};
    const radiusKm = 5;
    
    const result = isPointInCircle(point, center, radiusKm);
    
    expect(result).toBe(true);
  });
});
```

### Integration Test Example

```javascript
// MapDrawingIntegration.test.js
describe('Map Drawing Integration', () => {
  it('should filter profiles when polygon is drawn', async () => {
    // Render component
    const { getByTestId } = render(<MapScreenAdvanced {...props} />);
    
    // Simulate drawing
    fireEvent.click(getByTestId('polygon-button'));
    fireEvent.click(map, {latlng: {lat: 43.22, lng: 76.90}});
    fireEvent.click(map, {latlng: {lat: 43.23, lng: 76.95}});
    fireEvent.click(map, {latlng: {lat: 43.21, lng: 76.95}});
    fireEvent.dblClick(map);  // Finish
    
    // Wait for filter
    await waitFor(() => {
      expect(getByTestId('profile-count')).toHaveTextContent('2');
    });
  });
});
```

---

These examples show how to use, customize, and test the map drawing feature in your application.
