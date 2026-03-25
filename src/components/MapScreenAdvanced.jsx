import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Polygon, useMapEvents, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { KZ_REGIONS } from '../logic/constants';


// Custom map click handler component
const MapClickHandler = ({ onMapClick, selectedCenter, setSelectedCenter }) => {
  // Disabled: we use long-press dragging instead, not click-based centering
  // This prevents map from flying to clicked location during drags
  return null;
};

// Auto-zoom handler component - moves map when region is selected
const AutoZoomHandler = ({ selectedCenter, zoomLevel, selectedRegion }) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectedCenter && map && selectedRegion) {
      // Only animate when a region is actually selected
      console.log('Flying to region:', selectedRegion, 'center:', selectedCenter, 'zoom:', zoomLevel);
      map.flyTo(selectedCenter, zoomLevel, {
        duration: 1.2,
        easeLinearity: 0.5
      });
    }
  }, [selectedCenter, zoomLevel, map, selectedRegion]);
  
  return null;
};

// Dynamic radius adjuster on map - allows cursor to adjust radius
const RadiusAdjuster = ({ center, radius, setRadius, isAdjusting, setIsAdjusting }) => {
  const map = useMap();
  
  useMapEvents({
    mousedown() {
      // Start adjusting radius when user holds mouse button on the circle
      setIsAdjusting(true);
    },
    mousemove(e) {
      if (isAdjusting && center) {
        // Calculate distance from center to cursor
        const distance = map.distance(center, [e.latlng.lat, e.latlng.lng]);
        const radiusInKm = Math.round(distance / 1000 * 10) / 10; // Convert to km and round to 1 decimal
        if (radiusInKm >= 0.5) {
          setRadius(Math.min(radiusInKm, 50)); // Max 50 km
        }
      }
    },
    mouseup() {
      setIsAdjusting(false);
    },
  });
  
  return null;
};

// Long-press handler for map dragging
const LongPressHandler = () => {
  const map = useMap();
  const longPressTimerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef(null);

  useMapEvents({
    mousedown(e) {
      startPosRef.current = e.containerPoint;
      
      longPressTimerRef.current = setTimeout(() => {
        isDraggingRef.current = true;
        map._container.style.cursor = 'grabbing';
        map.dragging.enable();
        // Prevent click events during drag
        e.originalEvent.stopPropagation();
      }, 500); // 500ms long press
    },
    mousemove(e) {
      // If long press timer is still running, check if user moved too much (cancel drag)
      if (longPressTimerRef.current && startPosRef.current) {
        const dist = Math.hypot(
          e.containerPoint.x - startPosRef.current.x,
          e.containerPoint.y - startPosRef.current.y
        );
        // If moved more than 10px before 500ms, cancel long press
        if (dist > 10) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    },
    mouseup() {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        map.dragging.disable();
        map._container.style.cursor = 'grab';
      }
    },
    touchstart(e) {
      startPosRef.current = e.containerPoint;
      
      longPressTimerRef.current = setTimeout(() => {
        isDraggingRef.current = true;
        map._container.style.cursor = 'grabbing';
        map.dragging.enable();
        // Prevent default touch behavior during drag
        if (e.originalEvent) e.originalEvent.stopPropagation();
      }, 500); // 500ms long press
    },
    touchmove(e) {
      // If long press timer is still running, check if user moved too much (cancel drag)
      if (longPressTimerRef.current && startPosRef.current) {
        const dist = Math.hypot(
          e.containerPoint.x - startPosRef.current.x,
          e.containerPoint.y - startPosRef.current.y
        );
        // If moved more than 10px before 500ms, cancel long press
        if (dist > 10) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    },
    touchend() {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        map.dragging.disable();
        map._container.style.cursor = 'grab';
      }
    }
  });

  return null;
};

// Drawing handler for polygon, circle, and freehand shapes
const DrawHandler = ({ drawMode, drawnShapes, setDrawnShapes, calculateDistanceFn }) => {
  const map = useMap();
  const pointsRef = useRef([]);
  const isDrawingRef = useRef(false);
  const circleStartRef = useRef(null);
  const drawnShapesRef = useRef(drawnShapes); // Keep ref in sync with state

  // Keep ref in sync with state
  useEffect(() => {
    drawnShapesRef.current = drawnShapes;
  }, [drawnShapes]);

  // Disable dragging when in drawing mode
  useEffect(() => {
    if (drawMode) {
      map.dragging.disable();
      map._container.style.cursor = 'crosshair';
    } else {
      map.dragging.disable(); // Keep disabled (we use long-press instead)
      map._container.style.cursor = 'grab';
    }
  }, [drawMode, map]);

  useMapEvents({
    click(e) {
      if (!drawMode) return;
      if (drawMode === 'polygon') {
        pointsRef.current.push([e.latlng.lat, e.latlng.lng]);
        console.log('Polygon point added:', [e.latlng.lat, e.latlng.lng], 'Total points:', pointsRef.current.length);
      }
    },
    dblclick(e) {
      if (!drawMode || drawMode !== 'polygon') return;
      console.log('Double-click detected, points:', pointsRef.current.length);
      if (pointsRef.current.length > 2) {
        console.log('Polygon completed:', pointsRef.current);
        const newShape = { type: 'polygon', coordinates: pointsRef.current };
        setDrawnShapes([...drawnShapesRef.current, newShape]);
        pointsRef.current = [];
      }
    },
    mousedown(e) {
      if (!drawMode || (drawMode !== 'circle' && drawMode !== 'freehand')) return;
      if (drawMode === 'circle') {
        circleStartRef.current = [e.latlng.lat, e.latlng.lng];
      } else if (drawMode === 'freehand') {
        isDrawingRef.current = true;
        pointsRef.current = [[e.latlng.lat, e.latlng.lng]];
      }
    },
    mousemove(e) {
      if (!drawMode || !isDrawingRef.current) return;
      if (drawMode === 'freehand') {
        pointsRef.current.push([e.latlng.lat, e.latlng.lng]);
      }
    },
    mouseup(e) {
      if (!drawMode) return;
      if (drawMode === 'circle' && circleStartRef.current) {
        const radius = calculateDistanceFn(circleStartRef.current[0], circleStartRef.current[1], e.latlng.lat, e.latlng.lng);
        console.log('Circle drawn with radius:', radius, 'km');
        const newShape = { type: 'circle', center: circleStartRef.current, radius };
        setDrawnShapes([...drawnShapesRef.current, newShape]);
        circleStartRef.current = null;
      } else if (drawMode === 'freehand' && isDrawingRef.current && pointsRef.current.length > 2) {
        isDrawingRef.current = false;
        console.log('Freehand completed:', pointsRef.current);
        const newShape = { type: 'freehand', coordinates: pointsRef.current };
        setDrawnShapes([...drawnShapesRef.current, newShape]);
        pointsRef.current = [];
      }
    }
  });

  return null;
};

// Calculate distance (Haversine formula) - used by multiple components
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const MapScreenAdvanced = ({ 
  allProfiles = [], 
  auth = null,
  onSelectProfile = () => {}, 
  liked = new Set(),
  onLike = () => {},
  conversations = {},
  onSendMessage = () => {},
  setTab = () => {}
}) => {
  // Default to Almaty center
  const DEFAULT_CENTER = [43.238, 76.945];
  const DEFAULT_RADIUS = 5;

  const [selectedCenter, setSelectedCenter] = useState(DEFAULT_CENTER);
  const [searchRadius, setSearchRadius] = useState(DEFAULT_RADIUS);
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [searchText, setSearchText] = useState("");
  const [msgText, setMsgText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [mapMode, setMapMode] = useState("view"); // "view" or "draw"
  const [nearestRegion, setNearestRegion] = useState("");
  const [zoomLevel, setZoomLevel] = useState(12);
  const [isAdjustingRadius, setIsAdjustingRadius] = useState(false);
  const [housingFilter, setHousingFilter] = useState(null); // null = all, true = has housing, false = no housing
  const [genderFilter, setGenderFilter] = useState(null); // null = all, "male", "female", "other"
  const [drawMode, setDrawMode] = useState(null); // null, "polygon", "circle", "freehand"
  const [drawnShapes, setDrawnShapes] = useState([]); // array of {type, coordinates or center/radius}

  const colors = {
    matcha: '#7A9E7E',
    matchaMid: '#A8C5A0',
    matchaLight: '#C8DEC4',
    matchaPale: '#E4F0E0',
    matchaMist: '#F2F8F1',
    white: '#FFFFFF',
    cream: '#FAFDF9',
    ink: '#1C2B1E',
    ink60: 'rgba(28,43,30,0.6)',
    ink30: 'rgba(28,43,30,0.3)',
    ink10: 'rgba(28,43,30,0.08)',
  };

  // Get region name by ID
  const getRegionName = (regionId) => {
    const region = KZ_REGIONS.find(r => r.id === regionId);
    return region?.name || regionId || "Unknown";
  };

  // Point in polygon check (ray casting algorithm)
  // Coordinates are [lat, lng] format
  const pointInPolygon = (point, polygon) => {
    const [lat, lng] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [lat1, lng1] = polygon[i];
      const [lat2, lng2] = polygon[j];
      // Check if horizontal ray from point intersects edge
      const intersect = ((lat1 > lat) !== (lat2 > lat)) && (lng < ((lng2 - lng1) * (lat - lat1)) / (lat2 - lat1) + lng1);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Check if point is in circle
  const pointInCircle = (point, center, radius) => {
    const dist = calculateDistance(point[0], point[1], center[0], center[1]);
    return dist <= radius;
  };

  // Check if profile is within drawn shapes
  const isWithinDrawnShapes = (lat, lng) => {
    if (!drawnShapes.length) return true; // if no shapes, show all
    for (let shape of drawnShapes) {
      if (shape.type === 'polygon' && pointInPolygon([lat, lng], shape.coordinates)) return true;
      if (shape.type === 'circle' && pointInCircle([lat, lng], shape.center, shape.radius)) return true;
      if (shape.type === 'freehand' && pointInPolygon([lat, lng], shape.coordinates)) return true;
    }
    return false;
  };

  // Find nearest region to selected center
  useEffect(() => {
    const nearest = KZ_REGIONS.reduce((closest, region) => {
      const dist = calculateDistance(selectedCenter[0], selectedCenter[1], region.lat, region.lng);
      const closestDist = calculateDistance(selectedCenter[0], selectedCenter[1], closest.lat, closest.lng);
      return dist < closestDist ? region : closest;
    }, KZ_REGIONS[0]);
    
    setNearestRegion(nearest.name);
  }, [selectedCenter]);

  // Filter people by housing status
  useEffect(() => {
    if (!allProfiles || !allProfiles.length) {
      setFilteredPeople([]);
      return;
    }

    console.log("All profiles:", allProfiles.length);
    console.log("Sample profile:", allProfiles[0]);
    console.log("Selected region filter:", selectedRegion);
    console.log("Drawn shapes:", drawnShapes.length);

    let filtered = allProfiles
      .filter(p => {
        // Must have location
        if (!p.latitude || !p.longitude) {
          console.log("Profile missing coords:", p.name);
          return false;
        }
        
        // Don't show self
        if (auth && p.id === auth.id) return false;
        
        // Apply region filter
        if (selectedRegion && p.region !== selectedRegion) {
          console.log("Filtering out", p.name, "- region is", p.region, "but filter is", selectedRegion);
          return false;
        }
        
        // Apply housing filter
        if (housingFilter !== null) {
          const hasHousing = (p.tags || []).some(tag => 
            typeof tag === 'string' && (
              tag.toLowerCase().includes('жилье') ||
              tag.toLowerCase().includes('housing') ||
              tag.toLowerCase().includes('apartment') ||
              tag.toLowerCase().includes('room') ||
              tag.toLowerCase().includes('квартир')
            )
          );
          if (hasHousing !== housingFilter) return false;
        }
        
        // Apply gender filter
        if (genderFilter !== null && p.gender !== genderFilter) {
          return false;
        }
        
        // Apply drawn shapes filter
        if (!isWithinDrawnShapes(p.latitude, p.longitude)) {
          return false;
        }
        
        // Filter by search text
        if (searchText.trim()) {
          const searchLower = searchText.toLowerCase();
          const name = (p.name || "").toLowerCase();
          const occupation = (p.occupation || "").toLowerCase();
          const regionName = getRegionName(p.region).toLowerCase();
          const tags = ((p.tags || []).join(" ")).toLowerCase();
          
          const matches = 
            name.includes(searchLower) ||
            occupation.includes(searchLower) ||
            regionName.includes(searchLower) ||
            tags.includes(searchLower);
          
          if (!matches) return false;
        }
        
        return true;
      })
      .map(p => ({
        ...p,
        distance: 0 // No distance calculation needed
      }))
      .slice(0, 500);

    console.log("Filtered people:", filtered.length);
    setFilteredPeople(filtered);
  }, [allProfiles, selectedCenter, selectedRegion, searchText, auth, housingFilter, genderFilter, drawnShapes]);

  const handleSendMessage = async () => {
    if (!selectedPerson || msgText.trim().length < 10) return;
    setIsSending(true);
    try {
      onSendMessage(selectedPerson.id, msgText);
      setMsgText("");
      setTimeout(() => setIsSending(false), 800);
    } catch (err) {
      console.error("Error sending message:", err);
      setIsSending(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Quick region center buttons
  const popularRegions = KZ_REGIONS.slice(0, 8);

  // Inner map component
  const InnerMapContent = () => {
    return (
      <>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          tileSize={256}
          zoomOffset={0}
          crossOrigin={true}
          errorTileUrl="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        />

        {/* Long-press handler for map dragging */}
        <LongPressHandler />

        {/* Auto-zoom handler - enabled for region selection */}
        {selectedRegion && <AutoZoomHandler selectedCenter={selectedCenter} zoomLevel={zoomLevel} selectedRegion={selectedRegion} />}

        {/* Radius adjuster */}
        <RadiusAdjuster 
          center={selectedCenter}
          radius={searchRadius}
          setRadius={setSearchRadius}
          isAdjusting={isAdjustingRadius}
          setIsAdjusting={setIsAdjustingRadius}
        />

        {/* Click handler */}
        <MapClickHandler 
          onMapClick={() => {}}
          selectedCenter={selectedCenter}
          setSelectedCenter={setSelectedCenter}
        />

        {/* Drawing handler - enabled */}
        {drawMode && <DrawHandler drawMode={drawMode} drawnShapes={drawnShapes} setDrawnShapes={setDrawnShapes} calculateDistanceFn={calculateDistance} />}

        {/* Render drawn shapes */}
        {drawnShapes && drawnShapes.length > 0 ? (
          drawnShapes.map((shape, idx) => {
            console.log('Rendering shape', idx, ':', shape);
            if (shape.type === 'polygon' || shape.type === 'freehand') {
              console.log('Polygon with positions:', shape.coordinates);
              return (<Polygon key={idx} positions={shape.coordinates} color={colors.matcha} weight={2} opacity={0.5} fillOpacity={0.2} />);
            } else if (shape.type === 'circle') {
              console.log('Circle with center:', shape.center, 'radius:', shape.radius);
              return (<Circle key={idx} center={shape.center} radius={shape.radius * 1000} color={colors.matcha} weight={2} opacity={0.5} fillOpacity={0.2} />);
            }
            return null;
          })
        ) : (
          <div style={{ position: 'absolute', top: 10, left: 50, zIndex: 1000, background: 'white', padding: '5px', fontSize: '12px' }}>
            Drawn shapes: {drawnShapes.length}
          </div>
        )}

        {/* Search radius circle - REMOVED */}

        {/* Selected center marker - REMOVED for cleaner map */}

        {/* People markers - Show all registered profiles with their locations */}
        {filteredPeople.map(person => (
          <CircleMarker
            key={person.id}
            center={[person.latitude, person.longitude]}
            radius={12}
            weight={2.5}
            opacity={selectedPerson?.id === person.id ? 1 : 0.8}
            fillOpacity={selectedPerson?.id === person.id ? 0.95 : 0.8}
            color={liked.has(person.id) ? '#ff6b9d' : colors.matcha}
            fillColor={liked.has(person.id) ? '#ff6b9d' : colors.matcha}
            draggable={false}
            eventHandlers={{
              click: () => setSelectedPerson(person),
            }}
          >
            <Popup>
              <div style={{ fontSize: '11px', fontWeight: 600 }}>
                {person.name}, {person.age}<br/>
                {person.distance?.toFixed(1)} km
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Region centers - REMOVED for cleaner map view */}
      </>
    );
  };

  const styles = `
    .map-advanced-container {
      height: calc(100vh - 49px);
      display: grid;
      grid-template-columns: 400px 1fr;
      grid-template-rows: 70px 1fr;
      position: relative;
      background: ${colors.cream};
    }

    .map-adv-topbar {
      grid-column: 1 / -1;
      background: ${colors.white};
      border-bottom: 1px solid ${colors.matchaLight};
      display: flex;
      align-items: center;
      padding: 0 20px;
      gap: 16px;
      z-index: 10;
      overflow-x: auto;
    }

    .map-adv-topbar::-webkit-scrollbar {
      height: 3px;
    }

    .map-adv-topbar::-webkit-scrollbar-thumb {
      background: ${colors.matchaLight};
    }

    .map-adv-topbar-logo {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.1rem;
      font-weight: 600;
      color: ${colors.ink};
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .map-adv-topbar-logo span {
      color: ${colors.matcha};
    }

    .map-logo-mark {
      width: 26px;
      height: 26px;
      border-radius: 8px;
      background: ${colors.matcha};
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .map-adv-controls {
      display: flex;
      gap: 12px;
      align-items: center;
      flex: 1;
      min-width: 300px;
    }

    .map-adv-search {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      background: ${colors.matchaMist};
      border: 1.5px solid ${colors.matchaLight};
      border-radius: 10px;
      padding: 0 14px;
    }

    .map-adv-search input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-family: 'Geologica', sans-serif;
      font-size: 0.82rem;
      font-weight: 300;
      color: ${colors.ink};
      padding: 9px 0;
    }

    .map-adv-search input::placeholder {
      color: ${colors.ink30};
    }

    .map-adv-radius-ctrl {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: ${colors.matchaMist};
      border: 1.5px solid ${colors.matchaLight};
      border-radius: 10px;
      white-space: nowrap;
    }

    .map-adv-radius-ctrl input {
      width: 60px;
      height: 24px;
      cursor: pointer;
    }

    .map-adv-radius-ctrl label {
      font-size: 0.75rem;
      font-weight: 500;
      color: ${colors.ink};
    }

    .map-adv-radius-val {
      font-size: 0.75rem;
      font-weight: 600;
      color: ${colors.matcha};
      min-width: 25px;
    }

    .map-adv-location-badge {
      background: ${colors.matcha};
      color: ${colors.white};
      padding: 6px 12px;
      border-radius: 100px;
      font-size: 0.7rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }

    .map-adv-topbar-right {
      display: flex;
      gap: 8px;
      margin-left: auto;
      flex-shrink: 0;
    }

    .map-adv-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1.5px solid ${colors.matchaLight};
      background: ${colors.white};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .map-adv-btn:hover {
      background: ${colors.matchaMist};
      border-color: ${colors.matcha};
    }

    .map-adv-avi {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: ${colors.matchaPale};
      border: 2px solid ${colors.matchaLight};
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.85rem;
      font-weight: 600;
      color: ${colors.matcha};
      cursor: pointer;
      flex-shrink: 0;
    }

    .map-adv-sidebar {
      background: ${colors.white};
      border-right: 1px solid ${colors.matchaLight};
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .map-adv-sidebar-header {
      padding: 16px 20px;
      border-bottom: 1px solid ${colors.matchaLight};
    }

    .map-adv-sidebar-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.95rem;
      font-weight: 600;
      color: ${colors.ink};
      margin-bottom: 8px;
    }

    .map-adv-regions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .map-adv-region-chip {
      padding: 4px 10px;
      border-radius: 100px;
      border: 1.5px solid ${colors.matchaLight};
      background: ${colors.white};
      font-size: 0.65rem;
      font-weight: 400;
      color: ${colors.ink60};
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .map-adv-region-chip:hover {
      border-color: ${colors.matcha};
      color: ${colors.ink};
    }

    .map-adv-region-chip.active {
      background: ${colors.matcha};
      border-color: ${colors.matcha};
      color: ${colors.white};
    }

    .map-adv-sidebar-content {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .map-adv-results {
      padding: 16px 12px;
      flex: 1;
      overflow-y: auto;
    }

    .map-adv-results::-webkit-scrollbar {
      width: 3px;
    }

    .map-adv-results::-webkit-scrollbar-thumb {
      background: ${colors.matchaLight};
      border-radius: 2px;
    }

    .map-adv-card {
      display: flex;
      gap: 12px;
      padding: 12px;
      border: 1.5px solid ${colors.matchaLight};
      border-radius: 14px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.2s;
      background: ${colors.white};
    }

    .map-adv-card:hover,
    .map-adv-card.selected {
      border-color: ${colors.matcha};
      background: ${colors.matchaMist};
      box-shadow: 0 4px 12px rgba(122,158,126,0.1);
    }

    .map-adv-card-avatar {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      background: linear-gradient(145deg, ${colors.matchaPale}, ${colors.matchaLight});
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Cormorant Garamond', serif;
      font-size: 1rem;
      font-weight: 600;
      color: ${colors.matcha};
      flex-shrink: 0;
    }

    .map-adv-card-body {
      flex: 1;
      min-width: 0;
    }

    .map-adv-card-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.92rem;
      font-weight: 600;
      color: ${colors.ink};
      margin-bottom: 3px;
    }

    .map-adv-card-region {
      font-size: 0.63rem;
      color: ${colors.matcha};
      font-weight: 500;
      margin-bottom: 4px;
    }

    .map-adv-card-distance {
      font-size: 0.65rem;
      color: ${colors.ink60};
      margin-bottom: 6px;
    }

    .map-adv-card-tags {
      display: flex;
      gap: 3px;
      flex-wrap: wrap;
    }

    .map-adv-card-tag {
      font-size: 0.58rem;
      padding: 2px 6px;
      border-radius: 100px;
      background: ${colors.matchaPale};
      color: ${colors.matcha};
      border: 1px solid ${colors.matchaLight};
    }

    .map-adv-empty {
      padding: 24px;
      text-align: center;
      color: ${colors.ink60};
      font-size: 0.8rem;
    }

    .map-adv-canvas {
      position: relative;
      background: #E8F2E8;
      cursor: grab;
    }

    .map-adv-canvas:active {
      cursor: grabbing;
    }

    .leaflet-container {
      background: #E8F2E8;
      cursor: inherit;
    }

    .map-adv-detail-panel {
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 360px;
      background: ${colors.white};
      border: 1.5px solid ${colors.matchaLight};
      border-radius: 22px;
      padding: 18px;
      box-shadow: 0 16px 48px rgba(28,43,30,0.12);
      z-index: 400;
      max-height: 85vh;
      overflow-y: auto;
    }

    .map-adv-panel-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .map-adv-panel-close {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: ${colors.matchaPale};
      border: 1px solid ${colors.matchaLight};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: ${colors.ink60};
      font-size: 0.65rem;
      flex-shrink: 0;
    }

    .map-adv-panel-close:hover {
      background: ${colors.matchaLight};
    }

    .map-adv-panel-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.02rem;
      font-weight: 600;
      color: ${colors.ink};
      margin-bottom: 2px;
    }

    .map-adv-panel-location {
      font-size: 0.68rem;
      color: ${colors.ink60};
      margin-bottom: 3px;
    }

    .map-adv-panel-region {
      font-size: 0.68rem;
      color: ${colors.matcha};
      font-weight: 500;
    }

    .map-adv-panel-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: ${colors.matchaPale};
      border: 2px solid ${colors.matchaLight};
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Cormorant Garamond', serif;
      font-size: 1rem;
      font-weight: 600;
      color: ${colors.matcha};
      flex-shrink: 0;
    }

    .map-adv-panel-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
    }

    .map-adv-panel-info-item {
      background: ${colors.matchaMist};
      border-radius: 10px;
      padding: 8px;
      text-align: center;
    }

    .map-adv-panel-info-val {
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.92rem;
      font-weight: 600;
      color: ${colors.matcha};
    }

    .map-adv-panel-info-label {
      font-size: 0.58rem;
      color: ${colors.ink60};
    }

    .map-adv-panel-tags {
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }

    .map-adv-panel-tag {
      font-size: 0.6rem;
      padding: 3px 8px;
      border-radius: 100px;
      background: ${colors.matchaPale};
      color: ${colors.matcha};
      border: 1px solid ${colors.matchaLight};
    }

    .map-adv-panel-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .map-adv-btn-like {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: ${colors.matchaPale};
      border: 1.5px solid ${colors.matchaLight};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.1rem;
      transition: all 0.2s;
    }

    .map-adv-btn-like:hover {
      background: ${colors.matchaLight};
    }

    .map-adv-btn-like.liked {
      background: #FFE8E8;
      border-color: #E8A0A0;
    }

    .map-adv-btn-view {
      flex: 1;
      background: ${colors.ink};
      color: ${colors.white};
      border: none;
      border-radius: 10px;
      font-family: 'Geologica', sans-serif;
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      padding: 9px;
      transition: background 0.2s;
    }

    .map-adv-btn-view:hover {
      background: ${colors.matcha};
    }

    .map-adv-panel-message {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid ${colors.matchaLight};
    }

    .map-adv-panel-textarea {
      width: 100%;
      border: 1.5px solid ${colors.matchaLight};
      border-radius: 10px;
      padding: 9px 11px;
      font-family: 'Geologica', sans-serif;
      font-size: 0.8rem;
      resize: vertical;
      min-height: 75px;
      max-height: 140px;
      outline: none;
    }

    .map-adv-panel-textarea:focus {
      border-color: ${colors.matcha};
    }

    .map-adv-panel-textarea::placeholder {
      color: ${colors.ink30};
    }

    .map-adv-panel-char-count {
      font-size: 0.65rem;
      color: ${colors.ink60};
      text-align: right;
    }

    .map-adv-panel-btn-send {
      background: ${colors.ink};
      color: ${colors.white};
      border: none;
      border-radius: 10px;
      padding: 9px;
      font-family: 'Geologica', sans-serif;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .map-adv-panel-btn-send:hover:not(:disabled) {
      background: ${colors.matcha};
    }

    .map-adv-panel-btn-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 1024px) {
      .map-advanced-container {
        grid-template-columns: 1fr;
      }

      .map-adv-sidebar {
        display: none;
      }

      .map-adv-detail-panel {
        width: calc(100% - 40px);
        left: 20px;
      }
    }
  `;

  return (
    <div>
      <style>{styles}</style>
      <div className="map-advanced-container">
        {/* TOP BAR */}
        <div className="map-adv-topbar">
          <div className="map-adv-topbar-logo">
            <div className="map-logo-mark">
              <svg width="14" height="14" viewBox="0 0 17 17" fill="none">
                <path d="M8.5 2L14 6.8V15H10.5V11H6.5V15H3V6.8L8.5 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
            Roomate<span>.kz</span>
          </div>

          <div className="map-adv-controls">
                      {/* Housing filter buttons */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#fff',
            border: `1px solid ${colors.matchaLight}`,
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            zIndex: 1000,
            pointerEvents: 'auto',
            flexWrap: 'wrap'
          }}>
            <label style={{ fontSize: '0.7rem', fontWeight: '500', color: colors.ink30, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Filter:
            </label>
            <button
              onClick={() => setHousingFilter(null)}
              style={{
                padding: '8px 14px',
                background: housingFilter === null ? colors.matcha : '#fff',
                color: housingFilter === null ? '#fff' : colors.ink,
                border: `1.5px solid ${housingFilter === null ? colors.matcha : colors.matchaLight}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                fontFamily: "'Geologica', sans-serif"
              }}
              onMouseEnter={(e) => !true && (e.target.style.borderColor = colors.matcha)}
              onMouseLeave={(e) => !true && (e.target.style.borderColor = colors.matchaLight)}
            >
              All profiles
            </button>
            <button
              onClick={() => setHousingFilter(true)}
              style={{
                padding: '8px 14px',
                background: housingFilter === true ? colors.matcha : '#fff',
                color: housingFilter === true ? '#fff' : colors.ink,
                border: `1.5px solid ${housingFilter === true ? colors.matcha : colors.matchaLight}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                fontFamily: "'Geologica', sans-serif"
              }}
            >
              🏠 Has housing
            </button>
            <button
              onClick={() => setHousingFilter(false)}
              style={{
                padding: '8px 14px',
                background: housingFilter === false ? colors.matcha : '#fff',
                color: housingFilter === false ? '#fff' : colors.ink,
                border: `1.5px solid ${housingFilter === false ? colors.matcha : colors.matchaLight}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                fontFamily: "'Geologica', sans-serif"
              }}
            >
              🔍 Searching
            </button>

            {/* Gender filter separator */}
            <div style={{ width: '1px', height: '24px', background: colors.matchaLight, margin: '0 4px' }}></div>

            {/* Gender filter buttons */}
            <label style={{ fontSize: '0.7rem', fontWeight: '500', color: colors.ink30, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Gender:
            </label>
            <button
              onClick={() => setGenderFilter(null)}
              style={{
                padding: '8px 14px',
                background: genderFilter === null ? colors.matcha : '#fff',
                color: genderFilter === null ? '#fff' : colors.ink,
                border: `1.5px solid ${genderFilter === null ? colors.matcha : colors.matchaLight}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                fontFamily: "'Geologica', sans-serif"
              }}
            >
              All
            </button>
            <button
              onClick={() => setGenderFilter('female')}
              style={{
                padding: '8px 14px',
                background: genderFilter === 'female' ? colors.matcha : '#fff',
                color: genderFilter === 'female' ? '#fff' : colors.ink,
                border: `1.5px solid ${genderFilter === 'female' ? colors.matcha : colors.matchaLight}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                fontFamily: "'Geologica', sans-serif"
              }}
            >
              👩 Female
            </button>
            <button
              onClick={() => setGenderFilter('male')}
              style={{
                padding: '8px 14px',
                background: genderFilter === 'male' ? colors.matcha : '#fff',
                color: genderFilter === 'male' ? '#fff' : colors.ink,
                border: `1.5px solid ${genderFilter === 'male' ? colors.matcha : colors.matchaLight}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                fontFamily: "'Geologica', sans-serif"
              }}
            >
              👨 Male
            </button>
            <button
              onClick={() => setGenderFilter('other')}
              style={{
                padding: '8px 14px',
                background: genderFilter === 'other' ? colors.matcha : '#fff',
                color: genderFilter === 'other' ? '#fff' : colors.ink,
                border: `1.5px solid ${genderFilter === 'other' ? colors.matcha : colors.matchaLight}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                fontFamily: "'Geologica', sans-serif"
              }}
            >
              Other
            </button>

            {/* Drawing separator */}
            <div style={{ width: '1px', height: '24px', background: colors.matchaLight, margin: '0 4px' }}></div>

            {/* Drawing mode buttons */}
            <label style={{ fontSize: '0.7rem', fontWeight: '500', color: colors.ink30, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Draw:
            </label>
            <button
              onClick={() => setDrawMode(drawMode === 'polygon' ? null : 'polygon')}
              style={{
                padding: '8px 14px',
                background: drawMode === 'polygon' ? colors.matcha : '#fff',
                color: drawMode === 'polygon' ? '#fff' : colors.ink,
                border: `1.5px solid ${drawMode === 'polygon' ? colors.matcha : colors.matchaLight}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                fontFamily: "'Geologica', sans-serif"
              }}
            >
              🔺 Polygon
            </button>
            <button
              onClick={() => setDrawMode(drawMode === 'circle' ? null : 'circle')}
              style={{
                padding: '8px 14px',
                background: drawMode === 'circle' ? colors.matcha : '#fff',
                color: drawMode === 'circle' ? '#fff' : colors.ink,
                border: `1.5px solid ${drawMode === 'circle' ? colors.matcha : colors.matchaLight}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                fontFamily: "'Geologica', sans-serif"
              }}
            >
              ⭕ Circle
            </button>
            <button
              onClick={() => setDrawMode(drawMode === 'freehand' ? null : 'freehand')}
              style={{
                padding: '8px 14px',
                background: drawMode === 'freehand' ? colors.matcha : '#fff',
                color: drawMode === 'freehand' ? '#fff' : colors.ink,
                border: `1.5px solid ${drawMode === 'freehand' ? colors.matcha : colors.matchaLight}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                fontFamily: "'Geologica', sans-serif"
              }}
            >
              ✏️ Draw
            </button>
            {drawnShapes.length > 0 && (
              <button
                onClick={() => setDrawnShapes([])}
                style={{
                  padding: '8px 14px',
                  background: '#fff',
                  color: colors.ink,
                  border: `1.5px solid ${colors.matchaLight}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  fontFamily: "'Geologica', sans-serif"
                }}
              >
                ✕ Clear ({drawnShapes.length})
              </button>
            )}
          </div>

          {/* Drawing mode buttons */}
          <div style={{
            position: 'absolute',
            top: '140px',
            right: '20px',
            background: '#fff',
            border: `1px solid ${colors.matchaLight}`,
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            gap: '8px',
            flexDirection: 'column',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            zIndex: 1000,
            pointerEvents: 'auto'
          }}>
            <label style={{ fontSize: '0.7rem', fontWeight: '500', color: colors.ink30, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Draw area:
            </label>
            <button
              onClick={() => setDrawMode(drawMode === 'polygon' ? null : 'polygon')}
              style={{
                padding: '8px 12px',
                background: drawMode === 'polygon' ? colors.matcha : '#fff',
                color: drawMode === 'polygon' ? '#fff' : colors.ink,
                border: `1.5px solid ${drawMode === 'polygon' ? colors.matcha : colors.matchaLight}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                fontFamily: "'Geologica', sans-serif",
                textAlign: 'left'
              }}
            >
              ▭ Polygon (click to add points, double-click to finish)
            </button>
            <button
              onClick={() => setDrawMode(drawMode === 'circle' ? null : 'circle')}
              style={{
                padding: '8px 12px',
                background: drawMode === 'circle' ? colors.matcha : '#fff',
                color: drawMode === 'circle' ? '#fff' : colors.ink,
                border: `1.5px solid ${drawMode === 'circle' ? colors.matcha : colors.matchaLight}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                fontFamily: "'Geologica', sans-serif",
                textAlign: 'left'
              }}
            >
              ● Circle (click & drag to create)
            </button>
            <button
              onClick={() => setDrawMode(drawMode === 'freehand' ? null : 'freehand')}
              style={{
                padding: '8px 12px',
                background: drawMode === 'freehand' ? colors.matcha : '#fff',
                color: drawMode === 'freehand' ? '#fff' : colors.ink,
                border: `1.5px solid ${drawMode === 'freehand' ? colors.matcha : colors.matchaLight}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                fontFamily: "'Geologica', sans-serif",
                textAlign: 'left'
              }}
            >
              ✏ Freehand (click & drag to draw)
            </button>
            <button
              onClick={() => { setDrawnShapes([]); setDrawMode(null); }}
              style={{
                padding: '8px 12px',
                background: drawnShapes.length > 0 ? '#ffcccc' : '#f5f5f5',
                color: colors.ink,
                border: `1.5px solid ${drawnShapes.length > 0 ? '#ff9999' : colors.matchaLight}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                fontFamily: "'Geologica', sans-serif",
                textAlign: 'center'
              }}
            >
              Clear ({drawnShapes.length})
            </button>
          </div>

            

            <div className="map-adv-radius-ctrl" title="Drag on map to adjust radius">
              <label>Within</label>
              <span className="map-adv-radius-val" style={{ cursor: 'grab', fontWeight: 600, color: '#7A9E7E' }}>
                {searchRadius.toFixed(1)} km
              </span>
              <span style={{ fontSize: '0.65rem', color: 'rgba(28,43,30,0.6)', marginLeft: '4px' }}>🖱️ drag on map</span>
            </div>

            <div className="map-adv-location-badge">
              📍 {nearestRegion.substring(0, 20)}
            </div>
          </div>

          <div className="map-adv-topbar-right">
            <div className="map-adv-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L10 5.5H15L11.5 8.5L12.5 13L8 10.5L3.5 13L4.5 8.5L1 5.5H6L8 1Z" stroke={colors.matcha} strokeWidth="1.3" />
              </svg>
            </div>
            <div className="map-adv-avi">{auth?.initials || 'U'}</div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="map-adv-sidebar">
          <div className="map-adv-sidebar-header">
            <div className="map-adv-sidebar-title">Quick regions</div>
            <div className="map-adv-regions">
              {popularRegions.map(region => (
                <div
                  key={region.id}
                  className={`map-adv-region-chip ${selectedRegion === region.id ? 'active' : ''}`}
                  onClick={() => {
                    if (selectedRegion === region.id) {
                      console.log('Clearing region filter');
                      setSelectedRegion("");
                      setZoomLevel(10);
                    } else {
                      console.log('Setting region filter to:', region.id, region.name);
                      setSelectedRegion(region.id);
                      setSelectedCenter([region.lat, region.lng]);
                      setZoomLevel(13);
                    }
                  }}
                  title={region.name}
                >
                  {region.name.substring(0, 15)}
                </div>
              ))}
            </div>
          </div>

          <div className="map-adv-sidebar-content">
            <div className="map-adv-results">
              {filteredPeople.length > 0 ? (
                filteredPeople.map(person => (
                  <div
                    key={person.id}
                    className={`map-adv-card ${selectedPerson?.id === person.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPerson(person)}
                  >
                    <div className="map-adv-card-avatar">{getInitials(person.name)}</div>
                    <div className="map-adv-card-body">
                      <div className="map-adv-card-name">{person.name}, {person.age}</div>
                      <div className="map-adv-card-region">📍 {getRegionName(person.region)}</div>
                      <div className="map-adv-card-distance">{person.distance?.toFixed(1)} km away</div>
                      <div className="map-adv-card-tags">
                        {(person.tags || []).slice(0, 2).map((tag, i) => (
                          <span key={i} className="map-adv-card-tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="map-adv-empty">
                  <p>No people found within {searchRadius} km</p>
                  <p style={{ fontSize: '0.73rem', marginTop: '6px' }}>Try adjusting the radius or center point</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAP CANVAS */}
        <div className="map-adv-canvas">
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={12}
            style={{ width: '100%', height: '100%' }}
            dragging={false}
            touchZoom={true}
            scrollWheelZoom={true}
            keyboard={false}
            doubleClickZoom={false}
            zoomControl={true}
          >
            <InnerMapContent />
          </MapContainer>

          {/* Detail panel */}
          {selectedPerson && (
            <div className="map-adv-detail-panel">
              <div className="map-adv-panel-header">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div className="map-adv-panel-avatar">{getInitials(selectedPerson.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div className="map-adv-panel-title">{selectedPerson.name}, {selectedPerson.age}</div>
                    <div className="map-adv-panel-location">📍 {selectedPerson.distance?.toFixed(2)} km</div>
                    <div className="map-adv-panel-region">{getRegionName(selectedPerson.region)}</div>
                  </div>
                </div>
                <div 
                  className="map-adv-panel-close" 
                  onClick={() => setSelectedPerson(null)}
                >
                  ✕
                </div>
              </div>

              <div className="map-adv-panel-info">
                <div className="map-adv-panel-info-item">
                  <div className="map-adv-panel-info-val">{selectedPerson.age}</div>
                  <div className="map-adv-panel-info-label">age</div>
                </div>
                <div className="map-adv-panel-info-item">
                  <div className="map-adv-panel-info-val">{selectedPerson.occupation ? selectedPerson.occupation.substring(0, 10) : '—'}</div>
                  <div className="map-adv-panel-info-label">job</div>
                </div>
              </div>

              <div className="map-adv-panel-tags">
                {(selectedPerson.tags || []).slice(0, 3).map((tag, i) => (
                  <span key={i} className="map-adv-panel-tag">{tag}</span>
                ))}
              </div>

              <div className="map-adv-panel-actions">
                <button
                  className={`map-adv-btn-like ${liked.has(selectedPerson.id) ? 'liked' : ''}`}
                  onClick={() => onLike(selectedPerson)}
                >
                  {liked.has(selectedPerson.id) ? '❤️' : '🤍'}
                </button>
                <button
                  className="map-adv-btn-view"
                  onClick={() => onSelectProfile(selectedPerson)}
                >
                  View profile →
                </button>
              </div>

              <div className="map-adv-panel-message">
                <textarea
                  className="map-adv-panel-textarea"
                  placeholder="Write a message (min 10 chars)…"
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  maxLength={500}
                />
                <div className="map-adv-panel-char-count">{msgText.length}/500</div>
                <button
                  className="map-adv-panel-btn-send"
                  onClick={handleSendMessage}
                  disabled={msgText.trim().length < 10 || isSending}
                >
                  {isSending ? '✓ Sent' : '📨 Send'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapScreenAdvanced;
