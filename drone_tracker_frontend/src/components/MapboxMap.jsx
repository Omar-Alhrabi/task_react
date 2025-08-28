import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import useDroneStore from '../stores/droneStore';

const MapboxMap = ({ onMapLoad, onDroneSelect, selectedDroneId: propSelectedDroneId, mapboxAccessToken }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef(new Map());
  
  const { 
    drones, 
    selectedDroneId, 
    selectDrone, 
    clearSelection,
    connectionStatus
  } = useDroneStore();

  // Use prop selectedDroneId if provided, otherwise use store selectedDroneId
  const currentSelectedDroneId = propSelectedDroneId || selectedDroneId;

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapboxAccessToken) {
      console.error('Mapbox access token is required');
      return;
    }

    mapboxgl.accessToken = mapboxAccessToken;

    if (map.current) return; // Initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-122.4, 37.75], // San Francisco coordinates
      zoom: 12,
      pitch: 45,
      bearing: 0
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      if (onMapLoad) {
        onMapLoad(map.current);
      }
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxAccessToken, onMapLoad]);

  // Update drone markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Add new markers for each drone
    Array.from(drones.values()).forEach(drone => {
      if (!drone.position || !drone.position.lat || !drone.position.lng) return;

      // Determine drone color based on status
      const getDroneColor = (status) => {
        switch(status?.toLowerCase()) {
          case 'active':
          case 'flying':
            return '#00ff00'; // Green
          case 'warning':
          case 'low battery':
            return '#ffff00'; // Yellow
          case 'critical':
          case 'emergency':
          case 'unauthorized':
            return '#ff0000'; // Red
          case 'idle':
          case 'landed':
            return '#0080ff'; // Blue
          default:
            return '#00ff00'; // Default green
        }
      };

      const droneColor = getDroneColor(drone.status);
      const isSelected = currentSelectedDroneId === drone.id;

      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'drone-marker';
      markerElement.style.cssText = `
        width: 20px;
        height: 20px;
        background-color: ${droneColor};
        border-radius: 50%;
        border: ${isSelected ? '3px solid #ffffff' : '2px solid rgba(255,255,255,0.8)'};
        box-shadow: ${isSelected 
          ? `0 0 20px ${droneColor}, 0 0 40px ${droneColor}80`
          : `0 0 10px ${droneColor}80`};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        position: relative;
      `;

      // Add drone icon
      markerElement.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#000" style="font-weight: bold;">
          <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
        </svg>
      `;

      // Add pulsing effect for active drones
      if (drone.status?.toLowerCase() === 'active') {
        const pulseElement = document.createElement('div');
        pulseElement.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2px solid ${droneColor};
          opacity: 0.6;
          animation: pulse 2s infinite;
        `;
        markerElement.appendChild(pulseElement);
      }

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([drone.position.lng, drone.position.lat])
        .addTo(map.current);

      // Add click handler
      markerElement.addEventListener('click', () => {
        if (currentSelectedDroneId === drone.id) {
          clearSelection();
        } else {
          selectDrone(drone.id);
        }
        
        if (onDroneSelect) {
          onDroneSelect(drone.id);
        }
      });

      // Create popup for selected drone
      if (isSelected) {
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          closeOnClick: false
        })
        .setHTML(`
          <div style="
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            border: 1px solid rgba(255,255,255,0.2);
          ">
            <div style="font-weight: bold; margin-bottom: 4px;">
              ${drone.name}
            </div>
            <div style="font-size: 10px; opacity: 0.8;">
              Status: ${drone.status}<br/>
              Battery: ${drone.battery}%<br/>
              Altitude: ${Math.round(drone.position.altitude)}m
            </div>
          </div>
        `);
        
        marker.setPopup(popup);
        popup.addTo(map.current);
      }

      markersRef.current.set(drone.id, marker);
    });
  }, [drones, currentSelectedDroneId, mapLoaded, selectDrone, clearSelection, onDroneSelect]);

  // Center map on selected drone
  useEffect(() => {
    if (!map.current || !currentSelectedDroneId) return;

    const selectedDrone = drones.get(currentSelectedDroneId);
    if (selectedDrone && selectedDrone.position) {
      map.current.flyTo({
        center: [selectedDrone.position.lng, selectedDrone.position.lat],
        zoom: 15,
        duration: 1000
      });
    }
  }, [currentSelectedDroneId, drones]);

  return (
    <div className="map-container" style={{
      position: 'relative',
      width: '100%',
      height: '100vh'
    }}>
      <div 
        ref={mapContainer}
        style={{
          width: '100%',
          height: '100%'
        }}
      />
      
      {/* Connection Status */}
      <ConnectionStatus connectionStatus={connectionStatus} />
      
      {/* Add CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.3;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};

// Connection Status Component
const ConnectionStatus = ({ connectionStatus }) => {
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return { color: '#10B981', text: 'متصل', icon: '🟢' };
      case 'connecting':
        return { color: '#F59E0B', text: 'جاري الاتصال...', icon: '🟡' };
      case 'disconnected':
        return { color: '#6B7280', text: 'غير متصل', icon: '⚪' };
      case 'error':
        return { color: '#EF4444', text: 'خطأ في الاتصال', icon: '🔴' };
      default:
        return { color: '#6B7280', text: 'غير معروف', icon: '⚪' };
    }
  };
  
  const config = getStatusConfig();
  
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      background: 'rgba(30, 30, 30, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500',
      color: config.color,
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      zIndex: 1000,
      transition: 'all 0.3s ease'
    }}>
      <span style={{
        fontSize: '12px',
        animation: 'pulse 2s infinite'
      }}>{config.icon}</span>
      <span style={{
        fontSize: '13px',
        whiteSpace: 'nowrap'
      }}>{config.text}</span>
    </div>
  );
};

export default MapboxMap;