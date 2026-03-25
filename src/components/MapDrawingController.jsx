import React, { useState, useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * MapDrawingController - Manages all drawing interactions for the map
 * Integrates with MapScreenAdvanced to filter profiles by drawn areas
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

  // Ray casting algorithm to check if point is inside polygon
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

  // Check if point is inside circle
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

  // Filter profiles by all drawn areas
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
          const polygonShape = L.polygon(pathPointsRef.current, {
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
            latlngs: [...pathPointsRef.current], // Create copy to prevent mutations
            layer: polygonShape
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
