import React, { useState, useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

/**
 * MapDrawingLayer - Advanced shape drawing for map filtering
 * Supports: Polygon, Circle, and Freehand curves
 * Filters profiles based on drawn areas
 */
const MapDrawingLayer = ({ 
  allProfiles = [], 
  onProfilesFiltered = () => {},
  drawnAreas = [],
  setDrawnAreas = () => {}
}) => {
  const map = useMap();
  const drawnItemsRef = useRef(new L.FeatureGroup());
  const drawControlRef = useRef(null);
  const [drawingMode, setDrawingMode] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize Leaflet Draw if not already done
  useEffect(() => {
    if (!map) return;

    // Add drawn items layer
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
   * Start drawing polygon - click to add points, double-click to finish
   */
  const startPolygonMode = () => {
    if (!map) return;
    setDrawingMode('polygon');
    setIsDrawing(true);
    
    let polylinePoints = [];
    let polylinePreview = null;
    let polygonShape = null;

    const addPoint = (latlng) => {
      polylinePoints.push(latlng);
      
      // Update preview polyline
      if (polylinePreview) {
        map.removeLayer(polylinePreview);
      }
      polylinePreview = L.polyline(polylinePoints, {
        color: '#7A9E7E',
        weight: 2,
        opacity: 0.7,
        dashArray: '5, 5'
      }).addTo(map);

      // Show vertex points
      L.circleMarker(latlng, {
        radius: 4,
        color: '#7A9E7E',
        fillColor: '#fff',
        fillOpacity: 1,
        weight: 2
      }).addTo(map);
    };

    const finishPolygon = () => {
      if (polylinePoints.length < 3) {
        alert('Polygon needs at least 3 points');
        return;
      }

      // Create actual polygon
      polygonShape = L.polygon(polylinePoints, {
        color: '#7A9E7E',
        weight: 2,
        opacity: 0.7,
        fillColor: '#E4F0E0',
        fillOpacity: 0.3,
        interactive: true
      }).addTo(map);

      drawnItemsRef.current.addLayer(polygonShape);
      
      // Store in areas
      const newArea = {
        id: `polygon-${Date.now()}`,
        type: 'polygon',
        latlngs: polylinePoints,
        layer: polygonShape
      };
      setDrawnAreas([...drawnAreas, newArea]);
      
      // Filter profiles
      filterProfilesByArea(newArea);
      
      // Cleanup
      map.off('click', addPoint);
      map.off('dblclick', finishPolygon);
      map.off('mousemove', updatePreview);
      
      if (polylinePreview) map.removeLayer(polylinePreview);
      polylinePoints.forEach(p => {
        const markers = map._layers;
        Object.values(markers).forEach(layer => {
          if (layer instanceof L.CircleMarker && 
              layer.getLatLng().equals(p)) {
            map.removeLayer(layer);
          }
        });
      });
      
      setDrawingMode(null);
      setIsDrawing(false);
    };

    const updatePreview = (e) => {
      // Show cursor position hint
      map._container.style.cursor = 'crosshair';
    };

    // Click to add points, double-click to finish
    map.on('click', addPoint);
    map.on('dblclick', finishPolygon);
    map.on('mousemove', updatePreview);
  };

  /**
   * Start drawing circle - click to set center, drag to set radius
   */
  const startCircleMode = () => {
    if (!map) return;
    setDrawingMode('circle');
    setIsDrawing(true);

    let circleCenter = null;
    let circleShape = null;
    let isDrawingCircle = false;

    const startCircle = (e) => {
      if (!circleCenter) {
        circleCenter = e.latlng;
        isDrawingCircle = true;
        
        // Visual feedback for center
        L.circleMarker(circleCenter, {
          radius: 6,
          color: '#7A9E7E',
          fillColor: '#fff',
          fillOpacity: 1,
          weight: 2
        }).addTo(map);

        map._container.style.cursor = 'cell';
      } else {
        // Finish drawing
        finishCircle();
      }
    };

    const updateCircle = (e) => {
      if (!isDrawingCircle || !circleCenter) return;

      const radius = map.distance(circleCenter, e.latlng) / 1000; // Convert to km
      
      if (circleShape) {
        map.removeLayer(circleShape);
      }

      circleShape = L.circle(circleCenter, radius * 1000, {
        color: '#7A9E7E',
        weight: 2,
        opacity: 0.7,
        fillColor: '#E4F0E0',
        fillOpacity: 0.3
      }).addTo(map);
    };

    const finishCircle = () => {
      if (!circleCenter || !circleShape) return;

      drawnItemsRef.current.addLayer(circleShape);

      const radius = circleShape.getRadius() / 1000; // km
      const newArea = {
        id: `circle-${Date.now()}`,
        type: 'circle',
        center: circleCenter,
        radius: radius,
        layer: circleShape
      };
      setDrawnAreas([...drawnAreas, newArea]);

      // Filter profiles
      filterProfilesByArea(newArea);

      // Cleanup
      map.off('click', startCircle);
      map.off('mousemove', updateCircle);
      
      // Remove center marker
      const markers = map._layers;
      Object.values(markers).forEach(layer => {
        if (layer instanceof L.CircleMarker && 
            layer.getLatLng().equals(circleCenter) &&
            layer.getRadius() === 6) {
          map.removeLayer(layer);
        }
      });

      map._container.style.cursor = 'grab';
      setDrawingMode(null);
      setIsDrawing(false);
    };

    map.on('click', startCircle);
    map.on('mousemove', updateCircle);
  };

  /**
   * Start freehand drawing mode
   */
  const startFreehandMode = () => {
    if (!map) return;
    setDrawingMode('freehand');
    setIsDrawing(true);

    let isDrawingPath = false;
    let pathPoints = [];
    let pathPolyline = null;

    const startDrawing = (e) => {
      isDrawingPath = true;
      pathPoints = [e.latlng];
      map._container.style.cursor = 'crosshair';
    };

    const draw = (e) => {
      if (!isDrawingPath) return;
      
      pathPoints.push(e.latlng);

      if (pathPolyline) {
        map.removeLayer(pathPolyline);
      }

      pathPolyline = L.polyline(pathPoints, {
        color: '#7A9E7E',
        weight: 3,
        opacity: 0.8,
        dashArray: '2, 3'
      }).addTo(map);
    };

    const finishDrawing = () => {
      if (pathPoints.length < 3) {
        alert('Path needs at least 3 points');
        isDrawingPath = false;
        return;
      }

      isDrawingPath = false;

      // Convert freehand to polygon (closed path)
      const closedPath = [...pathPoints, pathPoints[0]];
      
      const polygonShape = L.polygon(pathPoints, {
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
        latlngs: pathPoints,
        layer: polygonShape
      };
      setDrawnAreas([...drawnAreas, newArea]);

      // Filter profiles
      filterProfilesByArea(newArea);

      // Cleanup
      map.off('mousedown', startDrawing);
      map.off('mousemove', draw);
      map.off('mouseup', finishDrawing);
      
      if (pathPolyline) map.removeLayer(pathPolyline);

      map._container.style.cursor = 'grab';
      setDrawingMode(null);
      setIsDrawing(false);
    };

    map.on('mousedown', startDrawing);
    map.on('mousemove', draw);
    map.on('mouseup', finishDrawing);
  };

  /**
   * Check if point is inside polygon using ray casting
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
   * Check if point is inside circle
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
   * Filter profiles by drawn area
   */
  const filterProfilesByArea = (area) => {
    const filtered = allProfiles.filter(profile => {
      if (!profile.latitude || !profile.longitude) return false;

      if (area.type === 'polygon' || area.type === 'freehand') {
        return isPointInPolygon(profile, area.latlngs);
      } else if (area.type === 'circle') {
        return isPointInCircle(profile, area.center, area.radius);
      }
      return false;
    });

    onProfilesFiltered(filtered);
  };

  /**
   * Clear all drawn areas
   */
  const clearAllDrawings = () => {
    drawnItemsRef.current.clearLayers();
    setDrawnAreas([]);
    onProfilesFiltered([]);
  };

  /**
   * Remove specific drawn area
   */
  const removeArea = (areaId) => {
    const area = drawnAreas.find(a => a.id === areaId);
    if (area && area.layer) {
      map.removeLayer(area.layer);
    }
    const updated = drawnAreas.filter(a => a.id !== areaId);
    setDrawnAreas(updated);
    
    // Recompute filtered profiles
    if (updated.length === 0) {
      onProfilesFiltered([]);
    } else {
      const allFiltered = [];
      updated.forEach(area => {
        const filtered = allProfiles.filter(profile => {
          if (!profile.latitude || !profile.longitude) return false;
          if (area.type === 'polygon' || area.type === 'freehand') {
            return isPointInPolygon(profile, area.latlngs);
          } else if (area.type === 'circle') {
            return isPointInCircle(profile, area.center, area.radius);
          }
          return false;
        });
        allFiltered.push(...filtered);
      });
      onProfilesFiltered([...new Set(allFiltered.map(p => p.id))].map(id => 
        allProfiles.find(p => p.id === id)
      ));
    }
  };

  return {
    startPolygonMode,
    startCircleMode,
    startFreehandMode,
    clearAllDrawings,
    removeArea,
    drawingMode,
    isDrawing,
    drawnAreas
  };
};

export default MapDrawingLayer;
