import React, { useState, useEffect, useCallback } from 'react';
import MapboxMap from './components/MapboxMap';
import DroneList from './components/DroneList';
import { useDroneStore, DroneDataObserver } from './stores/droneStore';
import { websocketService } from './services/websocketService';
import './App.css';

function App() {
  const [mapInstance, setMapInstance] = useState(null);
  const droneStore = useDroneStore();
  const { selectDrone, selectedDroneId, getDroneById } = droneStore;

  // Initialize WebSocket connection
  useEffect(() => {
    // Create and add observer
    const observer = new DroneDataObserver(useDroneStore);
    websocketService.addObserver(observer);
    
    // Connect to start receiving data
    websocketService.connect();
    
    return () => {
      websocketService.removeObserver(observer);
      websocketService.disconnect();
    };
  }, []);

  // Handle drone selection from sidebar
  const handleDroneClick = useCallback((droneId) => {
    selectDrone(droneId);
    
    // Center map on selected drone
    if (mapInstance) {
      const drone = getDroneById(droneId);
      if (drone && drone.longitude && drone.latitude) {
        mapInstance.flyTo({
          center: [drone.longitude, drone.latitude],
          zoom: 15,
          duration: 1000
        });
      }
    }
  }, [mapInstance, selectDrone, getDroneById]);

  // Handle map drone selection
  const handleMapDroneSelect = useCallback((droneId) => {
    selectDrone(droneId);
  }, [selectDrone]);

  return (
    <div className="app">
      <MapboxMap 
        onMapLoad={setMapInstance}
        onDroneSelect={handleMapDroneSelect}
        selectedDroneId={selectedDroneId}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
      />
      
      <DroneList 
        onDroneClick={handleDroneClick}
      />
    </div>
  );
}

export default App;
