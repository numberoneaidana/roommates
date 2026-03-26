import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapContainer, TileLayer, CircleMarker, Circle,
  Polygon, useMapEvents, Popup, useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { KZ_REGIONS } from '../logic/constants';

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Haversine distance in km between two lat/lng points */
const haversine = (lat1, lon1, lat2, lon2) => {
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

/**
 * Douglas-Peucker path simplification.
 * Reduces dense freehand points to a clean polygon without losing shape.
 * @param {Array<[lat,lng]>} points
 * @param {number} epsilon – tolerance in degrees (0.0003 ≈ 33 m)
 */
const douglasPeucker = (points, epsilon = 0.0003) => {
  if (points.length < 3) return points;

  const perp = (p, a, b) => {
    const [px, py] = [p[0] - a[0], p[1] - a[1]];
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag === 0) return Math.sqrt(px * px + py * py);
    return Math.abs(px * dy - py * dx) / mag;
  };

  let maxD = 0, idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perp(points[i], points[0], points[points.length - 1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > epsilon) {
    const l = douglasPeucker(points.slice(0, idx + 1), epsilon);
    const r = douglasPeucker(points.slice(idx), epsilon);
    return [...l.slice(0, -1), ...r];
  }
  return [points[0], points[points.length - 1]];
};

/**
 * Ray-casting point-in-polygon.
 * @param {[lat,lng]} point
 * @param {Array<[lat,lng]>} polygon
 */
const pointInPolygon = (point, polygon) => {
  const [lat, lng] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [lat1, lng1] = polygon[i];
    const [lat2, lng2] = polygon[j];
    const intersect =
      ((lat1 > lat) !== (lat2 > lat)) &&
      lng < ((lng2 - lng1) * (lat - lat1)) / (lat2 - lat1) + lng1;
    if (intersect) inside = !inside;
  }
  return inside;
};

/** Bounding-box pre-filter for polygon (fast first pass) */
const inBbox = (lat, lng, polygon) => {
  const lats = polygon.map(p => p[0]);
  const lngs = polygon.map(p => p[1]);
  return (
    lat >= Math.min(...lats) && lat <= Math.max(...lats) &&
    lng >= Math.min(...lngs) && lng <= Math.max(...lngs)
  );
};

/** Check if profile falls inside any drawn shape */
const isWithinShapes = (lat, lng, shapes) => {
  if (!shapes.length) return true;
  return shapes.some(shape => {
    if ((shape.type === 'polygon' || shape.type === 'freehand') && shape.coordinates?.length >= 3) {
      return inBbox(lat, lng, shape.coordinates) && pointInPolygon([lat, lng], shape.coordinates);
    }
    if (shape.type === 'circle' && shape.center && shape.radius > 0) {
      return haversine(lat, lng, shape.center[0], shape.center[1]) <= shape.radius;
    }
    return false;
  });
};

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Auto-flies to a region when selectedRegion changes */
const AutoZoomHandler = ({ selectedCenter, zoomLevel, selectedRegion }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedCenter && map && selectedRegion) {
      map.flyTo(selectedCenter, zoomLevel, { duration: 1.2, easeLinearity: 0.5 });
    }
  }, [selectedCenter, zoomLevel, map, selectedRegion]);
  return null;
};

/**
 * DrawHandler — handles all three drawing modes inside the Leaflet context.
 *
 * Modes:
 *   polygon  – click to place vertices, double-click to close
 *   circle   – mousedown to anchor center, drag to set radius, mouseup to finish
 *   freehand – mousedown + drag to paint path, mouseup to close into polygon
 *              (Douglas-Peucker simplification applied on finish)
 *
 * Escape key cancels any active drawing.
 */
const DrawHandler = ({ drawMode, drawnShapes, setDrawnShapes, onDrawModeChange }) => {
  const map = useMap();

  // Refs prevent stale closures in event listeners
  const pointsRef       = useRef([]);
  const isDrawingRef    = useRef(false);
  const circleStartRef  = useRef(null);
  const circleLayerRef  = useRef(null);
  const previewPolyRef  = useRef(null);
  const previewDotsRef  = useRef([]);
  const drawnRef        = useRef(drawnShapes);

  useEffect(() => { drawnRef.current = drawnShapes; }, [drawnShapes]);

  // Cursor + dragging
  useEffect(() => {
    if (!map) return;
    map.dragging.disable();
    map._container.style.cursor = drawMode ? 'crosshair' : 'grab';
  }, [drawMode, map]);

  const cleanup = useCallback(() => {
    if (!map) return;
    if (previewPolyRef.current) { map.removeLayer(previewPolyRef.current); previewPolyRef.current = null; }
    previewDotsRef.current.forEach(d => map.removeLayer(d));
    previewDotsRef.current = [];
    if (circleLayerRef.current) { map.removeLayer(circleLayerRef.current); circleLayerRef.current = null; }
    pointsRef.current = [];
    isDrawingRef.current = false;
    circleStartRef.current = null;
    map._container.style.cursor = 'grab';
  }, [map]);
  // Escape to cancel
  useEffect(() => {
    if (!map) return;
    const handleKey = (e) => {
      if (e.key !== 'Escape') return;
      cleanup();
      onDrawModeChange(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [map, onDrawModeChange, cleanup]);
  useMapEvents({
    // ── Polygon: click adds vertex, dblclick closes ──────────────────────────
    click(e) {
      if (drawMode !== 'polygon') return;
      const pt = [e.latlng.lat, e.latlng.lng];
      pointsRef.current.push(pt);

      // Draw dot
      const dot = L.circleMarker(e.latlng, {
        radius: 5, color: '#7A9E7E', fillColor: '#fff', fillOpacity: 1, weight: 2
      }).addTo(map);
      previewDotsRef.current.push(dot);

      // Update preview polyline
      if (previewPolyRef.current) map.removeLayer(previewPolyRef.current);
      if (pointsRef.current.length >= 2) {
        previewPolyRef.current = L.polyline(pointsRef.current, {
          color: '#7A9E7E', weight: 2, dashArray: '6 4', opacity: 0.8
        }).addTo(map);
      }
    },

    dblclick(e) {
      if (drawMode !== 'polygon') return;
      // Remove the extra point that the click handler added for the dblclick
      pointsRef.current.pop();
      if (pointsRef.current.length < 3) return;

      const coords = [...pointsRef.current];
      setDrawnShapes([...drawnRef.current, { type: 'polygon', coordinates: coords }]);
      cleanup();
      onDrawModeChange(null);
    },

    // ── Circle: mousedown = anchor, mousemove = live preview, mouseup = finish
    mousedown(e) {
      if (drawMode === 'circle') {
        circleStartRef.current = [e.latlng.lat, e.latlng.lng];
      }
      if (drawMode === 'freehand') {
        isDrawingRef.current = true;
        pointsRef.current = [[e.latlng.lat, e.latlng.lng]];
      }
    },

    mousemove(e) {
      if (drawMode === 'circle' && circleStartRef.current) {
        const radiusKm = haversine(
          circleStartRef.current[0], circleStartRef.current[1],
          e.latlng.lat, e.latlng.lng
        );
        if (circleLayerRef.current) map.removeLayer(circleLayerRef.current);
        circleLayerRef.current = L.circle(circleStartRef.current, {
          radius: radiusKm * 1000,
          color: '#7A9E7E', weight: 2, fillColor: '#E4F0E0', fillOpacity: 0.25
        }).addTo(map);
      }
      if (drawMode === 'freehand' && isDrawingRef.current) {
        pointsRef.current.push([e.latlng.lat, e.latlng.lng]);
        if (previewPolyRef.current) map.removeLayer(previewPolyRef.current);
        previewPolyRef.current = L.polyline(pointsRef.current, {
          color: '#7A9E7E', weight: 2.5, opacity: 0.85, dashArray: '2 3'
        }).addTo(map);
      }
    },

    mouseup(e) {
      if (drawMode === 'circle' && circleStartRef.current && circleLayerRef.current) {
        const radius = haversine(
          circleStartRef.current[0], circleStartRef.current[1],
          e.latlng.lat, e.latlng.lng
        );
        if (radius > 0.05) { // Ignore accidental clicks (< 50 m)
          setDrawnShapes([...drawnRef.current, {
            type: 'circle',
            center: circleStartRef.current,
            radius
          }]);
        }
        cleanup();
        onDrawModeChange(null);
      }

      if (drawMode === 'freehand' && isDrawingRef.current) {
        isDrawingRef.current = false;
        const raw = pointsRef.current;
        if (raw.length < 5) { cleanup(); return; }

        // Simplify & close polygon
        const simplified = douglasPeucker(raw, 0.0003);
        if (simplified.length >= 3) {
          setDrawnShapes([...drawnRef.current, {
            type: 'freehand',
            coordinates: simplified
          }]);
        }
        cleanup();
        onDrawModeChange(null);
      }
    }
  });

  return null;
};

// ─── Main component ────────────────────────────────────────────────────────────

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
  const DEFAULT_CENTER = [43.238, 76.945];

  // State
  const [selectedCenter, setSelectedCenter]   = useState(DEFAULT_CENTER);
  const [filteredPeople, setFilteredPeople]   = useState([]);
  const [selectedPerson, setSelectedPerson]   = useState(null);
  const [selectedRegion, setSelectedRegion]   = useState('');
  const [searchText, setSearchText]           = useState('');
  const [msgText, setMsgText]                 = useState('');
  const [isSending, setIsSending]             = useState(false);
  const [setNearestRegion]     = useState('');
  const [zoomLevel, setZoomLevel]             = useState(12);
  const [housingFilter, setHousingFilter]     = useState(null);
  const [genderFilter, setGenderFilter]       = useState(null);
  const [drawMode, setDrawMode]               = useState(null);
  const [drawnShapes, setDrawnShapes]         = useState([]);

  const colors = {
    matcha:      '#7A9E7E',
    matchaMid:   '#A8C5A0',
    matchaLight: '#C8DEC4',
    matchaPale:  '#E4F0E0',
    matchaMist:  '#F2F8F1',
    white:       '#FFFFFF',
    cream:       '#FAFDF9',
    ink:         '#1C2B1E',
    ink60:       'rgba(28,43,30,0.6)',
    ink30:       'rgba(28,43,30,0.3)',
    ink10:       'rgba(28,43,30,0.08)',
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const getRegionName = (id) => KZ_REGIONS.find(r => r.id === id)?.name || id || 'Unknown';

  const getInitials = (name) =>
    (name || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  const popularRegions = KZ_REGIONS.slice(0, 8);

  // ── Nearest region label ─────────────────────────────────────────────────────

  useEffect(() => {
    const nearest = KZ_REGIONS.reduce((best, r) => {
      const d = haversine(selectedCenter[0], selectedCenter[1], r.lat, r.lng);
      const bd = haversine(selectedCenter[0], selectedCenter[1], best.lat, best.lng);
      return d < bd ? r : best;
    }, KZ_REGIONS[0]);
    setNearestRegion(nearest.name);
  }, [selectedCenter, setNearestRegion ]);

  // ── Profile filtering ─────────────────────────────────────────────────────────
  // Re-runs whenever filters or drawn shapes change.

  useEffect(() => {
    if (!allProfiles?.length) { setFilteredPeople([]); return; }

    const result = allProfiles
      .filter(p => {
        if (!p.latitude || !p.longitude) return false;
        if (auth && p.id === auth.id) return false;
        if (selectedRegion && p.region !== selectedRegion) return false;
        if (housingFilter !== null) {
          const has = (p.tags || []).some(t =>
            typeof t === 'string' && /жилье|housing|apartment|room|квартир/i.test(t)
          );
          if (has !== housingFilter) return false;
        }
        if (genderFilter !== null && p.gender !== genderFilter) return false;
        if (!isWithinShapes(p.latitude, p.longitude, drawnShapes)) return false;
        if (searchText.trim()) {
          const q = searchText.toLowerCase();
          const haystack = [p.name, p.occupation, getRegionName(p.region), ...(p.tags || [])].join(' ').toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .slice(0, 500);

    setFilteredPeople(result);
  }, [allProfiles, selectedRegion, searchText, auth, housingFilter, genderFilter, drawnShapes]);

  // ── Messaging ────────────────────────────────────────────────────────────────

  const handleSendMessage = async () => {
    if (!selectedPerson || msgText.trim().length < 10) return;
    setIsSending(true);
    try {
      onSendMessage(selectedPerson.id, msgText);
      setMsgText('');
      setTimeout(() => setIsSending(false), 800);
    } catch { setIsSending(false); }
  };

  // ── Drawing helpers ──────────────────────────────────────────────────────────

  const toggleDraw = (mode) => setDrawMode(prev => (prev === mode ? null : mode));
  const clearShapes = () => { setDrawnShapes([]); setDrawMode(null); };

  // ── Inner map ─────────────────────────────────────────────────────────────────

  const InnerMapContent = () => (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        crossOrigin
      />

      {selectedRegion && (
        <AutoZoomHandler
          selectedCenter={selectedCenter}
          zoomLevel={zoomLevel}
          selectedRegion={selectedRegion}
        />
      )}

      {/* Drawing logic lives here (needs map context) */}
      <DrawHandler
        drawMode={drawMode}
        drawnShapes={drawnShapes}
        setDrawnShapes={setDrawnShapes}
        onDrawModeChange={setDrawMode}
      />

      {/* Render drawn shapes as Leaflet React components */}
      {drawnShapes.map((shape, i) => {
        if ((shape.type === 'polygon' || shape.type === 'freehand') && shape.coordinates?.length >= 3) {
          return (
            <Polygon
              key={i}
              positions={shape.coordinates}
              pathOptions={{ color: colors.matcha, weight: 2, opacity: 0.7, fillColor: colors.matchaPale, fillOpacity: 0.25 }}
            />
          );
        }
        if (shape.type === 'circle' && shape.center) {
          return (
            <Circle
              key={i}
              center={shape.center}
              radius={shape.radius * 1000}
              pathOptions={{ color: colors.matcha, weight: 2, opacity: 0.7, fillColor: colors.matchaPale, fillOpacity: 0.25 }}
            />
          );
        }
        return null;
      })}

      {/* Profile markers */}
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
          eventHandlers={{ click: () => setSelectedPerson(person) }}
        >
          <Popup>
            <div style={{ fontSize: 11, fontWeight: 600 }}>
              {person.name}, {person.age}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );

  // ─── Styles ───────────────────────────────────────────────────────────────────

  const css = `
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
      gap: 12px;
      z-index: 10;
      overflow-x: auto;
    }
    .map-adv-topbar::-webkit-scrollbar { height: 3px; }
    .map-adv-topbar::-webkit-scrollbar-thumb { background: ${colors.matchaLight}; }
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
    .map-adv-topbar-logo span { color: ${colors.matcha}; }
    .map-logo-mark {
      width: 26px; height: 26px;
      border-radius: 8px;
      background: ${colors.matcha};
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .map-adv-search {
      flex: 1; min-width: 140px;
      display: flex; align-items: center; gap: 8px;
      background: ${colors.matchaMist};
      border: 1.5px solid ${colors.matchaLight};
      border-radius: 10px;
      padding: 0 14px;
    }
    .map-adv-search input {
      flex: 1; border: none; outline: none; background: transparent;
      font-family: 'Geologica', sans-serif;
      font-size: 0.82rem; font-weight: 300; color: ${colors.ink}; padding: 9px 0;
    }
    .map-adv-search input::placeholder { color: ${colors.ink30}; }
    .map-adv-divider { width: 1px; height: 22px; background: ${colors.matchaLight}; flex-shrink: 0; }
    .map-adv-filter-label {
      font-size: 0.68rem; font-weight: 500; color: ${colors.ink30};
      text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; flex-shrink: 0;
    }
    .tb-btn {
      padding: 7px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.73rem;
      font-weight: 500;
      font-family: 'Geologica', sans-serif;
      transition: all 0.18s;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .tb-btn-idle {
      background: ${colors.white};
      color: ${colors.ink};
      border: 1.5px solid ${colors.matchaLight};
    }
    .tb-btn-idle:hover { border-color: ${colors.matcha}; background: ${colors.matchaMist}; }
    .tb-btn-active {
      background: ${colors.matcha};
      color: ${colors.white};
      border: 1.5px solid ${colors.matcha};
      box-shadow: 0 2px 8px rgba(122,158,126,0.3);
    }
    .tb-btn-danger {
      background: #fff0f0;
      color: #c0392b;
      border: 1.5px solid #f5b7b1;
    }
    .tb-btn-danger:hover { background: #fde8e8; }
    .draw-hint {
      display: flex; align-items: center; gap: 6px;
      background: ${colors.matchaPale};
      border: 1px solid ${colors.matchaLight};
      border-radius: 8px;
      padding: 5px 10px;
      font-size: 0.68rem; color: ${colors.matcha};
      animation: pulse 1.2s ease-in-out infinite;
      flex-shrink: 0;
    }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.65} }
    .map-adv-topbar-right { display: flex; gap: 8px; margin-left: auto; flex-shrink: 0; }
    .map-adv-avi {
      width: 32px; height: 32px; border-radius: 50%;
      background: ${colors.matchaPale}; border: 2px solid ${colors.matchaLight};
      display: flex; align-items: center; justify-content: center;
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.85rem; font-weight: 600; color: ${colors.matcha}; cursor: pointer;
    }
    .map-adv-sidebar {
      background: ${colors.white};
      border-right: 1px solid ${colors.matchaLight};
      display: flex; flex-direction: column; overflow: hidden;
    }
    .map-adv-sidebar-header { padding: 16px 20px; border-bottom: 1px solid ${colors.matchaLight}; }
    .map-adv-sidebar-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.95rem; font-weight: 600; color: ${colors.ink}; margin-bottom: 8px;
    }
    .map-adv-regions { display: flex; gap: 6px; flex-wrap: wrap; }
    .map-adv-region-chip {
      padding: 4px 10px; border-radius: 100px;
      border: 1.5px solid ${colors.matchaLight}; background: ${colors.white};
      font-size: 0.65rem; font-weight: 400; color: ${colors.ink60};
      cursor: pointer; transition: all 0.18s; white-space: nowrap;
    }
    .map-adv-region-chip:hover { border-color: ${colors.matcha}; color: ${colors.ink}; }
    .map-adv-region-chip.active { background: ${colors.matcha}; border-color: ${colors.matcha}; color: ${colors.white}; }
    .map-adv-sidebar-content { flex: 1; overflow-y: auto; }
    .map-adv-results { padding: 16px 12px; }
    .map-adv-results::-webkit-scrollbar { width: 3px; }
    .map-adv-results::-webkit-scrollbar-thumb { background: ${colors.matchaLight}; border-radius: 2px; }
    .map-adv-card {
      display: flex; gap: 12px; padding: 12px;
      border: 1.5px solid ${colors.matchaLight}; border-radius: 14px;
      margin-bottom: 10px; cursor: pointer; transition: all 0.18s; background: ${colors.white};
    }
    .map-adv-card:hover, .map-adv-card.selected {
      border-color: ${colors.matcha}; background: ${colors.matchaMist};
      box-shadow: 0 4px 12px rgba(122,158,126,0.1);
    }
    .map-adv-card-avatar {
      width: 64px; height: 64px; border-radius: 12px;
      background: linear-gradient(145deg, ${colors.matchaPale}, ${colors.matchaLight});
      display: flex; align-items: center; justify-content: center;
      font-family: 'Cormorant Garamond', serif;
      font-size: 1rem; font-weight: 600; color: ${colors.matcha}; flex-shrink: 0;
    }
    .map-adv-card-body { flex: 1; min-width: 0; }
    .map-adv-card-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.92rem; font-weight: 600; color: ${colors.ink}; margin-bottom: 3px;
    }
    .map-adv-card-region { font-size: 0.63rem; color: ${colors.matcha}; font-weight: 500; margin-bottom: 4px; }
    .map-adv-card-tags { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 4px; }
    .map-adv-card-tag {
      font-size: 0.58rem; padding: 2px 6px; border-radius: 100px;
      background: ${colors.matchaPale}; color: ${colors.matcha}; border: 1px solid ${colors.matchaLight};
    }
    .map-adv-results-count {
      font-size: 0.7rem; color: ${colors.ink30}; padding: 0 0 8px; font-family: 'Geologica', sans-serif;
    }
    .map-adv-empty { padding: 32px 24px; text-align: center; color: ${colors.ink60}; font-size: 0.8rem; }
    .map-adv-canvas { position: relative; background: #E8F2E8; cursor: grab; }
    .map-adv-canvas:active { cursor: grabbing; }
    .leaflet-container { background: #E8F2E8; cursor: inherit; }
    .map-adv-detail-panel {
      position: absolute; bottom: 20px; right: 20px; width: 360px;
      background: ${colors.white}; border: 1.5px solid ${colors.matchaLight};
      border-radius: 22px; padding: 18px;
      box-shadow: 0 16px 48px rgba(28,43,30,0.12); z-index: 400;
      max-height: 85vh; overflow-y: auto;
    }
    .map-adv-panel-header {
      display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px;
    }
    .map-adv-panel-close {
      width: 22px; height: 22px; border-radius: 50%;
      background: ${colors.matchaPale}; border: 1px solid ${colors.matchaLight};
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: ${colors.ink60}; font-size: 0.65rem; flex-shrink: 0;
    }
    .map-adv-panel-close:hover { background: ${colors.matchaLight}; }
    .map-adv-panel-title { font-family:'Cormorant Garamond',serif; font-size:1.02rem; font-weight:600; color:${colors.ink}; margin-bottom:2px; }
    .map-adv-panel-location { font-size:0.68rem; color:${colors.ink60}; margin-bottom:3px; }
    .map-adv-panel-region { font-size:0.68rem; color:${colors.matcha}; font-weight:500; }
    .map-adv-panel-avatar {
      width: 48px; height: 48px; border-radius: 50%;
      background: ${colors.matchaPale}; border: 2px solid ${colors.matchaLight};
      display: flex; align-items: center; justify-content: center;
      font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 600; color: ${colors.matcha};
    }
    .map-adv-panel-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
    .map-adv-panel-info-item { background: ${colors.matchaMist}; border-radius: 10px; padding: 8px; text-align: center; }
    .map-adv-panel-info-val { font-family:'Cormorant Garamond',serif; font-size:0.92rem; font-weight:600; color:${colors.matcha}; }
    .map-adv-panel-info-label { font-size:0.58rem; color:${colors.ink60}; }
    .map-adv-panel-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 12px; }
    .map-adv-panel-tag { font-size:0.6rem; padding:3px 8px; border-radius:100px; background:${colors.matchaPale}; color:${colors.matcha}; border:1px solid ${colors.matchaLight}; }
    .map-adv-panel-actions { display: flex; gap: 8px; margin-bottom: 12px; }
    .map-adv-btn-like {
      width:38px; height:38px; border-radius:10px;
      background:${colors.matchaPale}; border:1.5px solid ${colors.matchaLight};
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; font-size:1.1rem; transition:all 0.18s;
    }
    .map-adv-btn-like:hover { background: ${colors.matchaLight}; }
    .map-adv-btn-like.liked { background:#FFE8E8; border-color:#E8A0A0; }
    .map-adv-btn-view {
      flex:1; background:${colors.ink}; color:${colors.white}; border:none;
      border-radius:10px; font-family:'Geologica',sans-serif;
      font-size:0.78rem; font-weight:500; cursor:pointer; padding:9px; transition:background 0.18s;
    }
    .map-adv-btn-view:hover { background: ${colors.matcha}; }
    .map-adv-panel-message { display:flex; flex-direction:column; gap:8px; padding-top:12px; border-top:1px solid ${colors.matchaLight}; }
    .map-adv-panel-textarea {
      width:100%; border:1.5px solid ${colors.matchaLight}; border-radius:10px;
      padding:9px 11px; font-family:'Geologica',sans-serif; font-size:0.8rem;
      resize:vertical; min-height:75px; max-height:140px; outline:none; box-sizing:border-box;
    }
    .map-adv-panel-textarea:focus { border-color: ${colors.matcha}; }
    .map-adv-panel-textarea::placeholder { color: ${colors.ink30}; }
    .map-adv-panel-char-count { font-size:0.65rem; color:${colors.ink60}; text-align:right; }
    .map-adv-panel-btn-send {
      background:${colors.ink}; color:${colors.white}; border:none; border-radius:10px;
      padding:9px; font-family:'Geologica',sans-serif; font-size:0.8rem; font-weight:500;
      cursor:pointer; transition:background 0.18s;
    }
    .map-adv-panel-btn-send:hover:not(:disabled) { background: ${colors.matcha}; }
    .map-adv-panel-btn-send:disabled { opacity:0.5; cursor:not-allowed; }
    @media (max-width: 1024px) {
      .map-advanced-container { grid-template-columns: 1fr; }
      .map-adv-sidebar { display: none; }
      .map-adv-detail-panel { width: calc(100% - 40px); left: 20px; }
    }
  `;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div>
      <style>{css}</style>
      <div className="map-advanced-container">

        {/* ── TOP BAR ───────────────────────────────────────────────────── */}
        <div className="map-adv-topbar">
          <div className="map-adv-topbar-logo">
            <div className="map-logo-mark">
              <svg width="14" height="14" viewBox="0 0 17 17" fill="none">
                <path d="M8.5 2L14 6.8V15H10.5V11H6.5V15H3V6.8L8.5 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
            Roomate<span>.kz</span>
          </div>

          {/* Search */}
          <div className="map-adv-search" style={{ maxWidth: 220 }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke={colors.ink30} strokeWidth="1.8" />
              <path d="M15 15l3 3" stroke={colors.ink30} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              placeholder="Search profiles…"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>

          <div className="map-adv-divider" />

          {/* Housing filter */}
          <span className="map-adv-filter-label">Housing</span>
          {[
            { label: 'All', val: null },
            { label: '🏠 Has', val: true },
            { label: 'No', val: false }
          ].map(({ label, val }) => (
            <button
              key={String(val)}
              className={`tb-btn ${housingFilter === val ? 'tb-btn-active' : 'tb-btn-idle'}`}
              onClick={() => setHousingFilter(val)}
            >
              {label}
            </button>
          ))}

          <div className="map-adv-divider" />

          {/* Gender filter */}
          <span className="map-adv-filter-label">Gender</span>
          {[
            { label: 'All', val: null },
            { label: '👩 F', val: 'female' },
            { label: '👨 M', val: 'male' }
          ].map(({ label, val }) => (
            <button
              key={String(val)}
              className={`tb-btn ${genderFilter === val ? 'tb-btn-active' : 'tb-btn-idle'}`}
              onClick={() => setGenderFilter(val)}
            >
              {label}
            </button>
          ))}

          <div className="map-adv-divider" />

          {/* Draw tools */}
          <span className="map-adv-filter-label">Draw area</span>
          <button
            className={`tb-btn ${drawMode === 'freehand' ? 'tb-btn-active' : 'tb-btn-idle'}`}
            onClick={() => toggleDraw('freehand')}
            title="Hold & drag to paint a freehand area"
          >
            ✏️ Freehand
          </button>
          <button
            className={`tb-btn ${drawMode === 'polygon' ? 'tb-btn-active' : 'tb-btn-idle'}`}
            onClick={() => toggleDraw('polygon')}
            title="Click points, double-click to close"
          >
            🔺 Polygon
          </button>
          <button
            className={`tb-btn ${drawMode === 'circle' ? 'tb-btn-active' : 'tb-btn-idle'}`}
            onClick={() => toggleDraw('circle')}
            title="Click & drag to set a circle area"
          >
            ⭕ Circle
          </button>
          {drawnShapes.length > 0 && (
            <button className="tb-btn tb-btn-danger" onClick={clearShapes}>
              ✕ Clear ({drawnShapes.length})
            </button>
          )}

          {/* Active drawing hint */}
          {drawMode && (
            <div className="draw-hint">
              {drawMode === 'polygon' && '📍 Click to add points · double-click to finish · Esc to cancel'}
              {drawMode === 'circle'  && '⭕ Click & drag on the map · Esc to cancel'}
              {drawMode === 'freehand' && '✏️ Hold & drag to draw · release to finish · Esc to cancel'}
            </div>
          )}

          <div className="map-adv-topbar-right">
            <div className="map-adv-avi">{auth?.initials || 'U'}</div>
          </div>
        </div>

        {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
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
                      setSelectedRegion('');
                      setZoomLevel(10);
                    } else {
                      setSelectedRegion(region.id);
                      setSelectedCenter([region.lat, region.lng]);
                      setZoomLevel(13);
                    }
                  }}
                >
                  {region.name.substring(0, 15)}
                </div>
              ))}
            </div>
          </div>

          <div className="map-adv-sidebar-content">
            <div className="map-adv-results">
              {drawnShapes.length > 0 && (
                <div className="map-adv-results-count">
                  {filteredPeople.length} profile{filteredPeople.length !== 1 ? 's' : ''} in drawn area
                </div>
              )}
              {filteredPeople.length > 0 ? filteredPeople.map(person => (
                <div
                  key={person.id}
                  className={`map-adv-card ${selectedPerson?.id === person.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPerson(person)}
                >
                  <div className="map-adv-card-avatar">{getInitials(person.name)}</div>
                  <div className="map-adv-card-body">
                    <div className="map-adv-card-name">{person.name}, {person.age}</div>
                    <div className="map-adv-card-region">📍 {getRegionName(person.region)}</div>
                    <div className="map-adv-card-tags">
                      {(person.tags || []).slice(0, 2).map((tag, i) => (
                        <span key={i} className="map-adv-card-tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="map-adv-empty">
                  {drawnShapes.length > 0
                    ? 'No profiles found in drawn area'
                    : 'No profiles match your filters'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── MAP CANVAS ────────────────────────────────────────────────── */}
        <div className="map-adv-canvas">
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={12}
            style={{ width: '100%', height: '100%' }}
            dragging={false}
            touchZoom
            scrollWheelZoom
            keyboard={false}
            doubleClickZoom={false}
            zoomControl
          >
            <InnerMapContent />
          </MapContainer>

          {/* Detail panel */}
          {selectedPerson && (
            <div className="map-adv-detail-panel">
              <div className="map-adv-panel-header">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div className="map-adv-panel-avatar">{getInitials(selectedPerson.name)}</div>
                  <div>
                    <div className="map-adv-panel-title">{selectedPerson.name}, {selectedPerson.age}</div>
                    <div className="map-adv-panel-region">{getRegionName(selectedPerson.region)}</div>
                  </div>
                </div>
                <div className="map-adv-panel-close" onClick={() => setSelectedPerson(null)}>✕</div>
              </div>

              <div className="map-adv-panel-info">
                <div className="map-adv-panel-info-item">
                  <div className="map-adv-panel-info-val">{selectedPerson.age}</div>
                  <div className="map-adv-panel-info-label">age</div>
                </div>
                <div className="map-adv-panel-info-item">
                  <div className="map-adv-panel-info-val">{selectedPerson.occupation?.substring(0, 10) || '—'}</div>
                  <div className="map-adv-panel-info-label">job</div>
                </div>
              </div>

              <div className="map-adv-panel-tags">
                {(selectedPerson.tags || []).slice(0, 3).map((tag, i) => (
                  <span key={i} className="map-adv-panel-tag">{tag}</span>
                ))}
                {selectedPerson.verification_status === 'approved' && (
                  <span className="map-adv-panel-tag" style={{ background: colors.matchaPale, color: colors.matcha, border: `1px solid ${colors.matchaLight}` }}>✓ Верифицирован</span>
                )}
                {selectedPerson.verification_status === 'pending' && (
                  <span className="map-adv-panel-tag" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid rgba(146,64,14,0.2)' }}>⏳ На проверке</span>
                )}
              </div>

              <div className="map-adv-panel-actions">
                <button
                  className={`map-adv-btn-like ${liked.has(selectedPerson.id) ? 'liked' : ''}`}
                  onClick={() => onLike(selectedPerson)}
                >
                  {liked.has(selectedPerson.id) ? '❤️' : '🤍'}
                </button>
                <button className="map-adv-btn-view" onClick={() => onSelectProfile(selectedPerson)}>
                  View profile →
                </button>
              </div>

              <div className="map-adv-panel-message">
                <textarea
                  className="map-adv-panel-textarea"
                  placeholder="Write a message (min 10 chars)…"
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
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