import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapContainer, TileLayer, CircleMarker, Circle,
  Polygon, useMapEvents, Popup, useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { KZ_REGIONS } from '../logic/constants';
import { ProfileModal } from '../App';
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

  // Cursor + dragging — enable native pan when not in a draw mode
  useEffect(() => {
    if (!map) return;
    if (drawMode) {
      map.dragging.disable();
      map._container.style.cursor = 'crosshair';
    } else {
      map.dragging.enable();
      map._container.style.cursor = 'grab';
    }
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
  }, [map, cleanup, onDrawModeChange]);

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

// ─── Map-specific ProfileModal wrapper (right sidebar, no blur) ────────────────

const MapProfilePanel = ({ p, liked, sent, msgText, setMsgText, KZ_REGIONS: regionsFromProp, onLike, onSend, onClose, hasMatch = false, likedYou = false, inline = false }) => {
  const [isSending, setIsSending] = useState(false);
  const [localPhoto, setLocalPhoto] = useState(0);

  const regions = regionsFromProp || KZ_REGIONS;
  const reg = regions.find(r => r.id === p.region);

  const handleSend = () => {
    if (msgText.trim().length < 10 || isSending || !hasMatch) return;
    setIsSending(true);
    onSend();
    setTimeout(() => { setIsSending(false); }, 1200);
  };

  return (
    <div style={inline ? {
      position: "relative",
      width: "100%",
      height: "100%",
      background: "#FFFFFF",
      overflow: "auto",
    } : {
      position: "fixed",
      top: "138px",
      right: 0,
      bottom: 0,
      width: "520px",
      background: "#FFFFFF",
      boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
      zIndex: 999,
      overflow: "auto",
      animation: "slideInRight 0.3s ease-out"
    }}>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      
      {/* Close Button */}
      <button onClick={onClose} style={{
        position: inline ? "sticky" : "fixed",
        top: "158px",
        right: "20px",
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: "#FFFFFF",
        border: "1.5px solid #C8DEC4",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        zIndex: 1000
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5L15 15" stroke="#1C2B1E" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>

      {/* Content Wrapper */}
      <div style={{ padding: "32px 24px" }}>
        
        {/* HERO IMAGE */}
        <div style={{
          position: "relative",
          height: "240px",
          background: p.photos?.[localPhoto]?.startsWith("http") ? `url(${p.photos[localPhoto]}) center/cover` : `linear-gradient(135deg, #5a8f6f 0%, #4a7a5f 100%)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: "16px",
          marginBottom: "20px",
          overflow: "hidden"
        }}>
          {/* Photo Indicators */}
          {p.photos && p.photos.length > 0 && (
            <div style={{ position: "absolute", bottom: "12px", left: "12px", display: "flex", gap: "6px" }}>
              {p.photos.map((_, i) => (
                <button key={i} onClick={() => setLocalPhoto(i)} style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: localPhoto === i ? "white" : "rgba(255,255,255,0.4)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}/>
              ))}
            </div>
          )}

          {/* Online Status */}
          {p.online && (
            <div style={{
              position: "absolute",
              bottom: "12px",
              right: "12px",
              background: "#FFFFFF",
              borderRadius: "100px",
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#22C55E"
            }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22C55E" }}/>
              Онлайн
            </div>
          )}
        </div>

        {/* Header */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
            <div>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.6rem",
                fontWeight: 600,
                color: "#1C2B1E",
                margin: "0 0 4px 0",
                lineHeight: 1
              }}>{p.name}, {p.age}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                {p.verification_status === 'approved' && (
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "#E4F0E0",
                    color: "#7A9E7E",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: 600
                  }}>✓ Верифицирован</div>
                )}
              </div>
            </div>
            <button onClick={onLike} style={{
              background: liked ? "#E4F0E0" : "#F2F8F1",
              border: `2px solid ${liked ? "#7A9E7E" : "#C8DEC4"}`,
              borderRadius: "14px",
              padding: "10px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600,
              color: liked ? "#7A9E7E" : "#1C2B1E",
              transition: "all 0.2s",
              fontFamily: "'Geologica', sans-serif"
            }}>
              {liked ? "❤️ В избранном" : "🤍 В избранное"}
            </button>
          </div>
        </div>

        {/* Meta Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
          <div style={{
            background: "#F2F8F1",
            borderRadius: "12px",
            padding: "10px 12px",
            fontSize: "12px"
          }}>
            <div style={{ color: "rgba(28,43,30,0.6)", fontWeight: 500, marginBottom: "2px" }}>Локация</div>
            <div style={{ color: "#1C2B1E", fontWeight: 600 }}>📍 {reg?.name || p.region}</div>
          </div>
          <div style={{
            background: "#F2F8F1",
            borderRadius: "12px",
            padding: "10px 12px",
            fontSize: "12px"
          }}>
            <div style={{ color: "rgba(28,43,30,0.6)", fontWeight: 500, marginBottom: "2px" }}>Бюджет</div>
            <div style={{ color: "#1C2B1E", fontWeight: 600 }}>💰 ₸{(p.budget || 0).toLocaleString()}/мес</div>
          </div>
          <div style={{
            background: "#F2F8F1",
            borderRadius: "12px",
            padding: "10px 12px",
            fontSize: "12px"
          }}>
            <div style={{ color: "rgba(28,43,30,0.6)", fontWeight: 500, marginBottom: "2px" }}>Профессия</div>
            <div style={{ color: "#1C2B1E", fontWeight: 600 }}>{p.occupation || "—"}</div>
          </div>
          <div style={{
            background: "#F2F8F1",
            borderRadius: "12px",
            padding: "10px 12px",
            fontSize: "12px"
          }}>
            <div style={{ color: "rgba(28,43,30,0.6)", fontWeight: 500, marginBottom: "2px" }}>Въезд</div>
            <div style={{ color: "#1C2B1E", fontWeight: 600 }}>{p.move_in || "—"}</div>
          </div>
        </div>

        {/* Renter Type Badge */}
        {p.renterType && (
          <div style={{
            background: p.renterType === "has_place" ? "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)" : "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)",
            borderRadius: "12px",
            padding: "12px",
            marginBottom: "16px",
            border: `2px solid ${p.renterType === "has_place" ? "#FBBF24" : "#0EA5E9"}`,
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <span style={{ fontSize: "24px" }}>{p.renterType === "has_place" ? "🏠" : "🔍"}</span>
            <div>
              <div style={{
                fontSize: "13px",
                fontWeight: 600,
                color: p.renterType === "has_place" ? "#92400E" : "#075985"
              }}>{p.renterType === "has_place" ? "Есть своё жильё" : "Ищет жильё"}</div>
              <div style={{
                fontSize: "11px",
                color: p.renterType === "has_place" ? "#92400E" : "#075985",
                opacity: 0.8
              }}>{p.renterType === "has_place" ? "Ищет соседа к себе" : "Ищет квартиру и соседа"}</div>
            </div>
          </div>
        )}

        {/* About Section */}
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "#1C2B1E",
            margin: "0 0 8px 0"
          }}>О себе</h3>
          <p style={{
            fontSize: "13px",
            lineHeight: 1.6,
            color: "rgba(28,43,30,0.7)",
            margin: 0
          }}>{p.bio}</p>
        </div>

        {/* Lifestyle Section */}
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "#1C2B1E",
            margin: "0 0 10px 0"
          }}>Образ жизни</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "10px" }}>
            {[["Чистоплотность", p.cleanliness], ["Общительность", p.social]].map(([l, v]) => (
              <div key={l}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                  fontSize: "12px"
                }}>
                  <span style={{ fontWeight: 600, color: "#1C2B1E" }}>{l}</span>
                  <span style={{ fontWeight: 600, color: "#7A9E7E" }}>{v || 0}/5</span>
                </div>
                <div style={{
                  height: "6px",
                  background: "#E4F0E0",
                  borderRadius: "3px"
                }}>
                  <div style={{
                    height: "100%",
                    background: "#7A9E7E",
                    borderRadius: "3px",
                    width: `${((v || 0) / 5) * 100}%`
                  }}/>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {p.pets && <span style={{
              background: "#E4F0E0",
              color: "#7A9E7E",
              padding: "6px 12px",
              borderRadius: "100px",
              fontSize: "11px",
              fontWeight: 500
            }}>🐾 Питомец</span>}
            {p.remote && <span style={{
              background: "#E4F0E0",
              color: "#7A9E7E",
              padding: "6px 12px",
              borderRadius: "100px",
              fontSize: "11px",
              fontWeight: 500
            }}>💻 Удалёнка</span>}
            {!p.smoking && <span style={{
              background: "#E4F0E0",
              color: "#7A9E7E",
              padding: "6px 12px",
              borderRadius: "100px",
              fontSize: "11px",
              fontWeight: 500
            }}>🚭 Не курит</span>}
          </div>
        </div>

        {/* Interests Section */}
        {p.tags && p.tags.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "#1C2B1E",
              margin: "0 0 8px 0"
            }}>Интересы</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {p.tags.map(t => (
                <span key={t} style={{
                  background: "#F2F8F1",
                  color: "#7A9E7E",
                  padding: "6px 12px",
                  borderRadius: "100px",
                  fontSize: "11px",
                  fontWeight: 500,
                  border: "1px solid #C8DEC4"
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Message Section */}
        <div style={{ borderTop: "1px solid #E4F0E0", paddingTop: "16px" }}>
          <h3 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "#1C2B1E",
            margin: "0 0 8px 0"
          }}>Написать сообщение</h3>

          {/* Match Status */}
          {!hasMatch && (
            <div style={{
              background: likedYou ? "#E0F2FE" : "#FEF3C7",
              borderRadius: "10px",
              padding: "12px",
              marginBottom: "12px",
              fontSize: "13px",
              color: likedYou ? "#075985" : "#92400E",
              border: `1.5px solid ${likedYou ? "#0EA5E9" : "#FBBF24"}`
            }}>
              {likedYou ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>❤️</span>
                  <div>
                    <strong>{p.name} лайкнул(а) вас!</strong>
                    <div style={{ fontSize: "12px", marginTop: "2px", opacity: 0.8 }}>Лайкните в ответ, чтобы начать чат</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>🔒</span>
                  <div>
                    <strong>Ожидание ответа</strong>
                    <div style={{ fontSize: "12px", marginTop: "2px", opacity: 0.8}}>Сообщение появится, если вас лайкнут в ответ</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <textarea
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            maxLength={300}
            placeholder={hasMatch ? "Напишите сообщение..." : "Доступно после взаимного лайка"}
            disabled={!hasMatch}
            style={{
              width: "100%",
              border: `1.5px solid ${hasMatch ? "#C8DEC4" : "#E8E8E8"}`,
              borderRadius: "10px",
              padding: "10px 12px",
              fontFamily: "'Geologica', sans-serif",
              fontSize: "13px",
              resize: "vertical",
              minHeight: "80px",
              maxHeight: "120px",
              outline: "none",
              boxSizing: "border-box",
              background: hasMatch ? "#FFFFFF" : "#F9F9F9",
              color: hasMatch ? "#1C2B1E" : "#999",
              opacity: hasMatch ? 1 : 0.7
            }}
            onFocus={e => hasMatch && (e.target.style.borderColor = "#7A9E7E")}
            onBlur={e => e.target.style.borderColor = "#C8DEC4"}
          />
          <div style={{
            fontSize: "11px",
            color: "rgba(28,43,30,0.6)",
            textAlign: "right",
            marginTop: "4px",
            marginBottom: "8px"
          }}>{msgText.length}/300</div>
          <button
            onClick={handleSend}
            disabled={msgText.trim().length < 10 || isSending || !hasMatch}
            style={{
              width: "100%",
              background: hasMatch ? "#1C2B1E" : "#CCCCCC",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "10px",
              padding: "10px",
              fontFamily: "'Geologica', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              cursor: (msgText.trim().length < 10 || isSending || !hasMatch) ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              opacity: (msgText.trim().length < 10 || isSending || !hasMatch) ? 0.6 : 1
            }}
            onMouseEnter={e => !isSending && msgText.trim().length >= 10 && hasMatch && (e.target.style.background = "#7A9E7E")}
            onMouseLeave={e => e.target.style.background = hasMatch ? "#1C2B1E" : "#CCCCCC"}
          >
            {isSending ? "✓ Отправлено" : "📨 Отправить"}
          </button>
        </div>

        <div style={{ height: "40px" }}/>
      </div>
    </div>
  );
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
  setTab = () => {},
  uiLang = "ru",
  TRANSLATIONS = {}
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
  const [sent, setSent]                       = useState(new Set());

  const [zoomLevel, setZoomLevel]             = useState(12);
  const [housingFilter, setHousingFilter]     = useState(null);
  const [genderFilter, setGenderFilter]       = useState(null);
  const [drawMode, setDrawMode]               = useState(null);
  const [drawnShapes, setDrawnShapes]         = useState([]);
  // 'map' = default map+sidebar, 'seekers' = full list view for people without housing
  const [viewMode, setViewMode]               = useState('map');

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


  // ── Profile filtering ─────────────────────────────────────────────────────────
  // Re-runs whenever filters or drawn shapes change.

  useEffect(() => {
    if (!allProfiles?.length) { setFilteredPeople([]); return; }

    const result = allProfiles
      .filter(p => {
        if (auth && p.id === auth.id) return false;
        
        // In 'seekers' view, only show people looking for housing
        if (viewMode === 'seekers') {
          if (p.renterType !== 'looking') return false;
        } else {
          // In 'map' view, apply housing filter
          if (!p.latitude || !p.longitude) return false;
          if (housingFilter !== null) {
            if (housingFilter === true) {
              // Show people WITH housing
              if (p.renterType !== 'has_place') return false;
            } else {
              // Show people WITHOUT housing
              if (p.renterType !== 'looking') return false;
            }
          }
          if (!isWithinShapes(p.latitude, p.longitude, drawnShapes)) return false;
        }
        
        if (selectedRegion && p.region !== selectedRegion) return false;
        if (genderFilter !== null && p.gender !== genderFilter) return false;
        if (searchText.trim()) {
          const q = searchText.toLowerCase();
          const haystack = [p.name, p.occupation, getRegionName(p.region), ...(p.tags || [])].join(' ').toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .slice(0, 500);

    setFilteredPeople(result);
  }, [allProfiles, selectedRegion, searchText, auth, housingFilter, genderFilter, drawnShapes, viewMode]);

  // ── Messaging ────────────────────────────────────────────────────────────────

  const handleSendMessage = async () => {
    if (!selectedPerson || msgText.trim().length < 10) return;
    setIsSending(true);
    try {
      onSendMessage(selectedPerson.id, msgText);
      setSent(s => { const n = new Set(s); n.add(selectedPerson.id); return n; });
      setMsgText('');
      setTimeout(() => setIsSending(false), 800);
    } catch { setIsSending(false); }
  };

  // ── Drawing helpers ──────────────────────────────────────────────────────────

  const toggleDraw = (mode) => setDrawMode(prev => (prev === mode ? null : mode));
  const clearShapes = () => { setDrawnShapes([]); setDrawMode(null); };
  const handleDrawModeChange = useCallback((mode) => setDrawMode(mode), []);



  // ─── Styles ───────────────────────────────────────────────────────────────────

  const css = `
    .map-advanced-container {
      height: calc(100vh - 68px);
      display: grid;
      grid-template-columns: 400px 1fr;
      grid-template-rows: 70px 1fr;
      position: relative;
      background: ${colors.cream};
      margin-top: 68px;
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
    .map-adv-canvas { position: relative; background: #E8F2E8; }
    .leaflet-container { background: #E8F2E8; }
    .leaflet-grab { cursor: grab; }
    .leaflet-dragging .leaflet-grab,
    .leaflet-dragging .leaflet-grab .leaflet-interactive,
    .leaflet-dragging .leaflet-marker-draggable { cursor: grabbing; }
    .map-adv-detail-panel {
      position: absolute;top: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  width: 380px;
  border-radius: 0; /* Remove rounded corners for a clean "sidebar" look */
  border-left: 1px solid ${colors.matchaLight};
      background: ${colors.white}; border: 1.5px solid ${colors.matchaLight};
      border-radius: 22px; padding: 18px;
      box-shadow: 0 16px 48px rgba(28,43,30,0.12); z-index: 400;
      max-height: 85vh; overflow-y: auto;
    }
      animation: slideIn 0.3s ease-out;

@keyframes slideIn {
  from { transform: translateX(100%); } /* Start completely off-screen to the right */
  to { transform: translateX(0); }     /* End at its natural position */
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
    .map-adv-uniarea {display:flex; flex-direction:row; width: fit-content;
     border-radius: 20px; padding: 5px;  
     background: ${colors.matcha}; 
     border: 1px solid rgba(122,158,126,0.3); 
     transition: all 0.18s; 
     aligne-items: center; gap: 6px;
      padding:9px; font-family:'Geologica',sans-serif; font-size:0.63rem; font-weight:500;
    margin-bottom: 4px;

     }

    .uni-divider {
      opacity: 0.5;
      font-size: 0.5rem;
    }
      .map-adv-tag-row {
  display: flex;       /* Arrange children in a row */
  flex-direction: row; 
  gap: 6px;            /* The physical gap between the two circles */
  flex-wrap: wrap;     /* If the screen is too small, the second circle jumps down safely */
  margin-bottom: 8px;
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

          <div className="map-adv-divider" />

          {/* Housing filter — also switches view mode */}
          <span className="map-adv-filter-label">{TRANSLATIONS[uiLang]?.map?.housing || "Жильё"}</span>
          {[
            { label: TRANSLATIONS[uiLang]?.all || "Все", val: null, mode: 'map' },
            { label: TRANSLATIONS[uiLang]?.yes || "🏠 Есть жильё", val: true, mode: 'map' },
            { label: TRANSLATIONS[uiLang]?.no || "🔍 Ищет жильё", val: false, mode: 'seekers' }
          ].map(({ label, val, mode }) => (
            <button
              key={String(val)}
              className={`tb-btn ${housingFilter === val ? 'tb-btn-active' : 'tb-btn-idle'}`}
              onClick={() => { setHousingFilter(val); setViewMode(mode); setSelectedPerson(null); }}
            >
              {label}
            </button>
          ))}

          <div className="map-adv-divider" />

          {/* Gender filter */}
          <span className="map-adv-filter-label">{TRANSLATIONS[uiLang]?.gender || "Gender"}</span>
          {[
            { label: TRANSLATIONS[uiLang]?.all || "All", val: null },
            { label: TRANSLATIONS[uiLang]?.female || "Female", val: 'female' },
            { label: TRANSLATIONS[uiLang]?.male || "Male", val: 'male' }
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

          {/* Draw tools — only relevant in map mode */}
          {viewMode === 'map' && <>
          <span className="map-adv-filter-label">{TRANSLATIONS[uiLang]?.map?.drawArea || "Draw area"}</span>
          <button
            className={`tb-btn ${drawMode === 'freehand' ? 'tb-btn-active' : 'tb-btn-idle'}`}
            onClick={() => toggleDraw('freehand')}
            title="Hold & drag to paint a freehand area"
          >
            ✏️ {TRANSLATIONS[uiLang]?.map?.drawFreehand || "Freehand"}
          </button>
          <button
            className={`tb-btn ${drawMode === 'polygon' ? 'tb-btn-active' : 'tb-btn-idle'}`}
            onClick={() => toggleDraw('polygon')}
            title="Click points, double-click to close"
          >
            🔺 {TRANSLATIONS[uiLang]?.map?.drawPolygon || "Polygon"}
          </button>
          <button
            className={`tb-btn ${drawMode === 'circle' ? 'tb-btn-active' : 'tb-btn-idle'}`}
            onClick={() => toggleDraw('circle')}
            title="Click & drag to set a circle area"
          >
            ⭕ {TRANSLATIONS[uiLang]?.map?.drawCircle || "Circle"}
          </button>
          {drawnShapes.length > 0 && (
            <button className="tb-btn tb-btn-danger" onClick={clearShapes}>
              ✕ {TRANSLATIONS[uiLang]?.map?.clearShapes || "Clear"} ({drawnShapes.length})
            </button>
          )}

          {/* Active drawing hint */}
          {drawMode ? (
            <div className="draw-hint">
              {drawMode === 'polygon'  && '📍 Click points · double-click to finish · Esc to cancel'}
              {drawMode === 'circle'   && '⭕ Click & drag to set radius · Esc to cancel'}
              {drawMode === 'freehand' && '✏️ Hold & drag to draw · release to finish · Esc to cancel'}
            </div>
          ) : (
            <div className="draw-hint" style={{ opacity: 0.6, animation: 'none' }}>
              🖐 Drag map to pan · scroll to zoom
            </div>
          )}
          </>}

          <div className="map-adv-topbar-right">
            <div className="map-adv-avi">{auth?.initials || 'U'}</div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
             VIEW A — MAP MODE  (All / Has housing)
             Grid: sidebar (400px) + map canvas
        ══════════════════════════════════════════════════════════════ */}
        {viewMode === 'map' && <>

          {/* ── SIDEBAR ─────────────────────────────────────────────── */}
          <div className="map-adv-sidebar">
            <div className="map-adv-sidebar-header">
              <div className="map-adv-sidebar-title">{TRANSLATIONS[uiLang]?.region || "Регионы"}</div>
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
                      <div className="map-adv-tag-row">
                        <div className="map-adv-uniarea">{person.occupation?.substring(0, 20) || '—'}</div>
                        {person.occupation === "student" && (
                          <div className="map-adv-uniarea">{person.university?.substring(0, 20)}</div>
                        )}
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

          {/* ── MAP CANVAS ──────────────────────────────────────────── */}
          <div className="map-adv-canvas">
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={12}
              style={{ width: '100%', height: '100%' }}
              dragging={true}
              touchZoom
              scrollWheelZoom
              keyboard={false}
              doubleClickZoom={false}
              zoomControl
            >
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
              <DrawHandler
                drawMode={drawMode}
                drawnShapes={drawnShapes}
                setDrawnShapes={setDrawnShapes}
                onDrawModeChange={handleDrawModeChange}
              />
              {drawnShapes.map((shape, i) => {
                if ((shape.type === 'polygon' || shape.type === 'freehand') && shape.coordinates?.length >= 3) {
                  return <Polygon key={i} positions={shape.coordinates} pathOptions={{ color: colors.matcha, weight: 2, opacity: 0.7, fillColor: colors.matchaPale, fillOpacity: 0.25 }} />;
                }
                if (shape.type === 'circle' && shape.center) {
                  return <Circle key={i} center={shape.center} radius={shape.radius * 1000} pathOptions={{ color: colors.matcha, weight: 2, opacity: 0.7, fillColor: colors.matchaPale, fillOpacity: 0.25 }} />;
                }
                return null;
              })}
              {filteredPeople.map(person => (
                <CircleMarker
                  key={person.id}
                  center={[person.latitude, person.longitude]}
                  radius={selectedPerson?.id === person.id ? 14 : 10}
                  weight={2}
                  opacity={0.9}
                  fillOpacity={selectedPerson?.id === person.id ? 0.95 : 0.75}
                  color={liked.has(person.id) ? '#2c4d1cff' : colors.matcha}
                  fillColor={liked.has(person.id) ? '#ff6b9d' : colors.matcha}
                  eventHandlers={{ click: () => setSelectedPerson(person) }}
                >
                  <Popup>
                    <div style={{ fontFamily: "'Geologica', sans-serif", fontSize: 12, fontWeight: 600, color: '#1C2B1E' }}>
                      {person.name}{person.age ? `, ${person.age}` : ''}<br />
                      <span style={{ fontWeight: 400, color: '#7A9E7E', fontSize: 11 }}>
                        📍 {KZ_REGIONS.find(r => r.id === person.region)?.name || person.region || ''}
                      </span>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>

            {selectedPerson && (() => {
              const hasMatch = !!conversations[selectedPerson.id];
              const likedYou = hasMatch || false;
              return (
                <MapProfilePanel
                  p={selectedPerson}
                  liked={liked.has(selectedPerson.id)}
                  sent={sent.has(selectedPerson.id)}
                  msgText={msgText}
                  setMsgText={setMsgText}
                  KZ_REGIONS={KZ_REGIONS}
                  onLike={() => onLike(selectedPerson)}
                  onSend={() => handleSendMessage()}
                  onClose={() => setSelectedPerson(null)}
                  hasMatch={hasMatch}
                  likedYou={likedYou}
                />
              );
            })()}
          </div>
        </>}

        {/* ══════════════════════════════════════════════════════════════
             VIEW B — SEEKERS MODE  (🔍 Ищет жильё)
             Full-width card grid, no map, profile panel on click
        ══════════════════════════════════════════════════════════════ */}
        {viewMode === 'seekers' && (
          <div className="seekers-view" style={{ gridColumn: '1 / -1', display: 'flex', overflow: 'hidden', background: colors.cream }}>

            {/* ── Left: scrollable card grid ─────────────────────────── */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '28px 32px',
            }}>

              {/* Header */}
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '1.6rem', fontWeight: 600, color: colors.ink, margin: '0 0 6px'
                }}>
                  🔍 Ищут жильё и соседа
                </h2>
                <p style={{ fontSize: '0.78rem', color: colors.ink60, margin: 0 }}>
                  {filteredPeople.length} анкет{filteredPeople.length === 1 ? 'а' : filteredPeople.length < 5 ? 'ы' : ''} · без своего жилья, ищут квартиру и соседа
                </p>
              </div>

              {/* Search bar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: colors.white,
                border: `1.5px solid ${colors.matchaLight}`,
                borderRadius: '12px',
                padding: '0 16px',
                marginBottom: '24px',
                maxWidth: '480px',
              }}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="9" cy="9" r="6" stroke={colors.ink30} strokeWidth="1.8"/>
                  <path d="M13.5 13.5L17 17" stroke={colors.ink30} strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <input
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  placeholder="Поиск по имени, профессии, тегам…"
                  style={{
                    flex: 1, border: 'none', outline: 'none', background: 'transparent',
                    fontFamily: "'Geologica', sans-serif",
                    fontSize: '0.82rem', color: colors.ink, padding: '11px 0',
                  }}
                />
                {searchText && (
                  <button onClick={() => setSearchText('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.ink30, fontSize: '1rem', padding: 0 }}>✕</button>
                )}
              </div>

              {/* Cards grid */}
              {filteredPeople.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.ink60 }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', fontWeight: 600, color: colors.ink, marginBottom: '6px' }}>Нет анкет</div>
                  <div style={{ fontSize: '0.78rem' }}>Попробуйте изменить фильтры</div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px',
                }}>
                  {filteredPeople.map(person => {
                    const isSelected = selectedPerson?.id === person.id;
                    const isLiked = liked.has(person.id);
                    return (
                      <div
                        key={person.id}
                        onClick={() => setSelectedPerson(isSelected ? null : person)}
                        style={{
                          background: colors.white,
                          border: `2px solid ${isSelected ? colors.matcha : colors.matchaLight}`,
                          borderRadius: '18px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? `0 8px 24px rgba(122,158,126,0.2)` : '0 2px 8px rgba(28,43,30,0.06)',
                          transform: isSelected ? 'translateY(-2px)' : 'none',
                        }}
                        onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = colors.matchaMid; e.currentTarget.style.boxShadow = '0 6px 20px rgba(122,158,126,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                        onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = colors.matchaLight; e.currentTarget.style.boxShadow = '0 2px 8px rgba(28,43,30,0.06)'; e.currentTarget.style.transform = 'none'; } }}
                      >
                        {/* Photo strip */}
                        <div style={{
                          height: '140px',
                          background: person.photos?.[0]?.startsWith('http')
                            ? `url(${person.photos[0]}) center/cover`
                            : `linear-gradient(135deg, ${colors.matchaLight} 0%, ${colors.matcha} 100%)`,
                          position: 'relative',
                        }}>
                          {/* Budget badge */}
                          <div style={{
                            position: 'absolute', bottom: '10px', left: '10px',
                            background: 'rgba(28,43,30,0.72)', backdropFilter: 'blur(6px)',
                            color: '#fff', borderRadius: '100px', padding: '4px 10px',
                            fontSize: '11px', fontWeight: 600,
                          }}>
                            💰 ₸{(person.budget || 0).toLocaleString()}/мес
                          </div>
                          {/* Online dot */}
                          {person.online && (
                            <div style={{
                              position: 'absolute', top: '10px', right: '10px',
                              width: '10px', height: '10px', borderRadius: '50%',
                              background: '#22C55E', border: '2px solid white',
                            }}/>
                          )}
                          {/* Initials fallback overlay */}
                          {!person.photos?.[0]?.startsWith('http') && (
                            <div style={{
                              position: 'absolute', inset: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: '2.2rem', fontWeight: 600, color: colors.white,
                            }}>{getInitials(person.name)}</div>
                          )}
                        </div>

                        {/* Card body */}
                        <div style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <div>
                              <div style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: '1.05rem', fontWeight: 600, color: colors.ink,
                              }}>{person.name}, {person.age}</div>
                              <div style={{ fontSize: '11px', color: colors.matcha, fontWeight: 500, marginTop: '2px' }}>
                                📍 {getRegionName(person.region)}
                              </div>
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); onLike(person); }}
                              style={{
                                background: isLiked ? '#FFE8E8' : colors.matchaMist,
                                border: `1.5px solid ${isLiked ? '#E8A0A0' : colors.matchaLight}`,
                                borderRadius: '10px',
                                width: '34px', height: '34px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', fontSize: '1rem', flexShrink: 0,
                                transition: 'all 0.2s',
                              }}
                            >{isLiked ? '❤️' : '🤍'}</button>
                          </div>

                          {/* Occupation / university tags */}
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            {person.occupation && (
                              <span style={{
                                background: colors.matcha, color: '#fff',
                                borderRadius: '100px', padding: '3px 9px', fontSize: '10px', fontWeight: 500,
                              }}>{person.occupation.substring(0, 22)}</span>
                            )}
                            {person.occupation === 'student' && person.university && (
                              <span style={{
                                background: colors.matchaPale, color: colors.matcha,
                                border: `1px solid ${colors.matchaLight}`,
                                borderRadius: '100px', padding: '3px 9px', fontSize: '10px', fontWeight: 500,
                              }}>{person.university.substring(0, 22)}</span>
                            )}
                          </div>

                          {/* Bio preview */}
                          {person.bio && (
                            <p style={{
                              fontSize: '11px', color: colors.ink60, lineHeight: 1.5,
                              margin: '0 0 8px',
                              display: '-webkit-box', WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>{person.bio}</p>
                          )}

                          {/* Interest tags */}
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {(person.tags || []).slice(0, 3).map((tag, i) => (
                              <span key={i} style={{
                                background: colors.matchaMist,
                                color: colors.matcha,
                                border: `1px solid ${colors.matchaLight}`,
                                borderRadius: '100px', padding: '2px 8px', fontSize: '10px',
                              }}>{tag}</span>
                            ))}
                          </div>

                          {/* Lifestyle pills */}
                          <div style={{ display: 'flex', gap: '5px', marginTop: '10px', flexWrap: 'wrap' }}>
                            {!person.smoking && <span style={{ fontSize: '10px', background: '#F0FDF4', color: '#166534', borderRadius: '100px', padding: '3px 8px' }}>🚭 Не курит</span>}
                            {person.pets && <span style={{ fontSize: '10px', background: '#FFF7ED', color: '#9A3412', borderRadius: '100px', padding: '3px 8px' }}>🐾 Питомец</span>}
                            {person.remote && <span style={{ fontSize: '10px', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '100px', padding: '3px 8px' }}>💻 Удалёнка</span>}
                            {person.verification_status === 'approved' && <span style={{ fontSize: '10px', background: colors.matchaPale, color: colors.matcha, borderRadius: '100px', padding: '3px 8px' }}>✓ Верифицирован</span>}
                          </div>

                          {/* Move-in date */}
                          {person.move_in && person.move_in !== '—' && (
                            <div style={{ marginTop: '10px', fontSize: '11px', color: colors.ink60 }}>
                              🗓 Въезд: <strong style={{ color: colors.ink }}>{person.move_in}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Right: profile detail panel (shown when card selected) ── */}
            {selectedPerson && (() => {
              const hasMatch = !!conversations[selectedPerson.id];
              const likedYou = hasMatch || false;
              return (
                <div style={{
                  width: '420px',
                  flexShrink: 0,
                  borderLeft: `1px solid ${colors.matchaLight}`,
                  overflowY: 'auto',
                  background: colors.white,
                  position: 'relative',
                }}>
                  <MapProfilePanel
                    p={selectedPerson}
                    liked={liked.has(selectedPerson.id)}
                    sent={sent.has(selectedPerson.id)}
                    msgText={msgText}
                    setMsgText={setMsgText}
                    KZ_REGIONS={KZ_REGIONS}
                    onLike={() => onLike(selectedPerson)}
                    onSend={() => handleSendMessage()}
                    onClose={() => setSelectedPerson(null)}
                    hasMatch={hasMatch}
                    likedYou={likedYou}
                    inline={true}
                  />
                </div>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
};

export default MapScreenAdvanced;