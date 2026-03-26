import React, { useState, useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * MapDrawingController - Manages all drawing interactions for the map
 * Implements:
 * - Douglas-Peucker algorithm for path simplification
 * - Ray Casting algorithm for point-in-polygon detection
 * - Bounding box filtering for spatial indexing
 * - Circle distance calculations for radius-based filtering
 */
const MapDrawingController = ({ 
  allProfiles = [],
  onProfilesFiltered = () => {},
  drawingMode = null,
  onDrawingModeChange = () => {},
  drawnAreas = [],
  onAreasChange = () => {},
  onIsDrawingChange = () => {}
}) => {
  const map = useMap();
  const drawnItemsRef = useRef(new L.FeatureGroup());
  const pathPointsRef = useRef([]);
  const pathPolylineRef = useRef(null);
  const isDrawingPathRef = useRef(false);

  // Initialize drawn items layer
  useEffect(() => {
    if (!map) return;
    const drawnItems = drawnItemsRef.current;
    if (!map.hasLayer(drawnItems)) {
      drawnItems.addTo(map);
    }
    return () => {
      if (map && map.hasLayer(drawnItems)) {
        map.removeLayer(drawnItems);
      }
    };
  }, [map]);

  /**
   * Douglas-Peucker Algorithm
   * Reduces the number of points in a path while preserving its shape
   * @param {Array} points - Array of {lat, lng} points
   * @param {Number} epsilon - Maximum distance from point to line
   * @returns {Array} Simplified points
   */
  const douglasPeucker = (points, epsilon = 0.0005) => {
    if (points.length < 3) return points;

    let dmax = 0;
    let index = 0;

    // Find the point with the maximum distance
    for (let i = 1; i < points.length - 1; i++) {
      const d = perpendicularDistance(points[i], points[0], points[points.length - 1]);
      if (d > dmax) {
        index = i;
        dmax = d;
      }
    }

    // If max distance is greater than epsilon, recursively simplify
    if (dmax > epsilon) {
      const rec1 = douglasPeucker(points.slice(0, index + 1), epsilon);
      const rec2 = douglasPeucker(points.slice(index), epsilon);
      return rec1.slice(0, rec1.length - 1).concat(rec2);
    } else {
      return [points[0], points[points.length - 1]];
    }
  };

  /**
   * Calculate perpendicular distance from point to line
   */
  const perpendicularDistance = (point, lineStart, lineEnd) => {
    let px = lineEnd.lat - lineStart.lat;
    let py = lineEnd.lng - lineStart.lng;
    let magnitude = Math.sqrt(px * px + py * py);
    if (magnitude === 0) return 0;
    px /= magnitude;
    py /= magnitude;
    let dx = point.lat - lineStart.lat;
    let dy = point.lng - lineStart.lng;
    let distance = Math.abs(px * dy - py * dx);
    return distance;
  };

  /**
   * Calculate bounding box for a set of points
   * Returns {minLat, maxLat, minLng, maxLng}
   */
  const calculateBoundingBox = (points) => {
    if (!points || points.length === 0) return null;
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs)
    };
  };

  /**
   * Check if point is within bounding box
   * Fast spatial indexing filter
   */
  const isPointInBoundingBox = (point, bbox) => {
    if (!bbox) return false;
    return (
      point.latitude >= bbox.minLat &&
      point.latitude <= bbox.maxLat &&
      point.longitude >= bbox.minLng &&
      point.longitude <= bbox.maxLng
    );
  };

  /**
   * Ray casting algorithm to check if point is inside polygon
   * Industry standard for point-in-polygon detection
   */
  const isPointInPolygon = (point, polygonPoints) => {
    const lat = point.latitude;
    const lng = point.longitude;
    let inside = false;

    for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
      const xi = polygonPoints[i].lat;
      const yi = polygonPoints[i].lng;
      const xj = polygonPoints[j].lat;
      const yj = polygonPoints[j].lng;

      const intersect = ((yi > lng) !== (yj > lng))
        && (lat < ((xj - xi) * (lng - yi) / (yj - yi) + xi));
      if (intersect) inside = !inside;
    }
    return inside;
  };

  /**
   * Check if point is inside circle using Haversine distance formula
   */
  const isPointInCircle = (point, center, radiusKm) => {
    const R = 6371; // Earth radius in km
    const dLat = ((point.latitude - center.lat) * Math.PI) / 180;
    const dLng = ((point.longitude - center.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((center.lat * Math.PI) / 180) *
        Math.cos((point.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return distance <= radiusKm;
  };

  /**
   * Filter profiles by all drawn areas
   * Uses bounding box for first-pass filtering (fast), then detailed checks
   */
  const filterProfilesByAreas = (areas) => {
    if (!areas || areas.length === 0) {
      onProfilesFiltered([]);
      return;
    }

    try {
      const filtered = allProfiles.filter(profile => {
        if (!profile || !profile.latitude || !profile.longitude) return false;

        // Profile must be in at least one drawn area
        return areas.some(area => {
          // Validate area data before processing
          if (!area || !area.type) return false;
          
          try {
            if ((area.type === 'polygon' || area.type === 'freehand') && area.latlngs) {
              // Validate latlngs array
              if (!Array.isArray(area.latlngs) || area.latlngs.length < 3) return false;
              // Extra safety check for each point
              if (!area.latlngs.every(p => p && typeof p.lat === 'number' && typeof p.lng === 'number')) return false;
              
              // OPTIMIZATION: First pass - bounding box filter (fast)
              const bbox = calculateBoundingBox(area.latlngs);
              if (!isPointInBoundingBox(profile, bbox)) return false;
              
              // Second pass - exact ray casting check (accurate)
              return isPointInPolygon(profile, area.latlngs);
            } else if (area.type === 'circle' && area.center && typeof area.radius === 'number') {
              // Validate circle data thoroughly
              if (!area.center || typeof area.center.lat !== 'number' || typeof area.center.lng !== 'number') return false;
              if (!isFinite(area.radius) || area.radius <= 0) return false;
              return isPointInCircle(profile, area.center, area.radius);
            }
          } catch (e) {
            console.warn('Error filtering area:', e);
            return false;
          }
          return false;
        });
      });

      onProfilesFiltered(filtered);
    } catch (e) {
      console.error('Error in filterProfilesByAreas:', e);
      onProfilesFiltered([]);
    }
  };


  // Start freehand drawing mode
  const startFreehandMode = () => {
    if (!map) return;
    onDrawingModeChange('freehand');
    onIsDrawingChange(true);
    map._container.style.cursor = 'crosshair';

    pathPointsRef.current = [];
    isDrawingPathRef.current = false;
    pathPolylineRef.current = null;

    const startDrawing = (e) => {
      isDrawingPathRef.current = true;
      pathPointsRef.current = [e.latlng];
    };

    const draw = (e) => {
      if (!isDrawingPathRef.current) return;

      pathPointsRef.current.push(e.latlng);

      if (pathPolylineRef.current) {
        map.removeLayer(pathPolylineRef.current);
      }

      pathPolylineRef.current = L.polyline(pathPointsRef.current, {
        color: '#7A9E7E',
        weight: 3,
        opacity: 0.8,
        dashArray: '2, 3'
      }).addTo(map);
    };

      const finishDrawing = () => {
        if (!pathPointsRef.current || pathPointsRef.current.length < 3) {
          alert('Path needs at least 3 points');
          isDrawingPathRef.current = false;
          return;
        }

        isDrawingPathRef.current = false;

        // Validate all points have valid lat/lng
        const validPoints = pathPointsRef.current.every(p => 
          p && typeof p.lat === 'number' && typeof p.lng === 'number' && 
          isFinite(p.lat) && isFinite(p.lng)
        );
        
        if (!validPoints) {
          console.error('Invalid freehand path points detected');
          if (pathPolylineRef.current) map.removeLayer(pathPolylineRef.current);
          map.off('mousedown', startDrawing);
          map.off('mousemove', draw);
          map.off('mouseup', finishDrawing);
          map._container.style.cursor = 'grab';
          onDrawingModeChange(null);
          onIsDrawingChange(false);
          return;
        }

        try {
          // OPTIMIZATION: Apply Douglas-Peucker simplification
          // Reduces jagged hand-drawn lines to clean polygons
          const simplifiedPoints = douglasPeucker(pathPointsRef.current, 0.0005);
          
          if (simplifiedPoints.length < 3) {
            alert('Simplified path needs at least 3 points. Please draw a larger area.');
            map.removeLayer(pathPolylineRef.current);
            return;
          }

          console.log(`Path simplification: ${pathPointsRef.current.length} points → ${simplifiedPoints.length} points`);

          const polygonShape = L.polygon(simplifiedPoints, {
            color: '#7A9E7E',
            weight: 2,
            opacity: 0.7,
            fillColor: '#E4F0E0',
            fillOpacity: 0.3
          }).addTo(map);

          drawnItemsRef.current.addLayer(polygonShape);

          const newArea = {
            id: `freehand-${Date.now()}`,
            type: 'freehand',
            latlngs: [...simplifiedPoints], // Use simplified points
            layer: polygonShape,
            originalPointCount: pathPointsRef.current.length,
            simplifiedPointCount: simplifiedPoints.length
          };
          const updatedAreas = [...drawnAreas, newArea];
          onAreasChange(updatedAreas);
          filterProfilesByAreas(updatedAreas);
        } catch (e) {
          console.error('Error creating freehand polygon:', e);
        }

        map.off('mousedown', startDrawing);
        map.off('mousemove', draw);
        map.off('mouseup', finishDrawing);

        if (pathPolylineRef.current) map.removeLayer(pathPolylineRef.current);

        map._container.style.cursor = 'grab';
        onDrawingModeChange(null);
        onIsDrawingChange(false);
      };

    map.on('mousedown', startDrawing);
    map.on('mousemove', draw);
    map.on('mouseup', finishDrawing);
  };

  // Remove specific area
  const removeArea = (areaId) => {
    const area = drawnAreas.find(a => a.id === areaId);
    if (area && area.layer) {
      map.removeLayer(area.layer);
    }
    const updatedAreas = drawnAreas.filter(a => a.id !== areaId);
    onAreasChange(updatedAreas);
    filterProfilesByAreas(updatedAreas);
  };

  // Clear all drawings
  const clearAllDrawings = () => {
    drawnItemsRef.current.clearLayers();
    onAreasChange([]);
    onProfilesFiltered([]);
  };

  // Handle escape key to cancel drawing
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && drawingMode) {
        // Cleanup
        if (pathPolylineRef.current) map.removeLayer(pathPolylineRef.current);

        map.off('click');
        map.off('dblclick');
        map.off('mousemove');
        map.off('mousedown');
        map.off('mouseup');

        map._container.style.cursor = 'grab';
        onDrawingModeChange(null);
        onIsDrawingChange(false);
      }
    };

    if (map) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [drawingMode, map]);

  return {
    startFreehandMode,
    removeArea,
    clearAllDrawings
  };
};

export default MapDrawingController;
