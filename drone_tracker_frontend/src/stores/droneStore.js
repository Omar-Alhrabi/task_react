import { create } from 'zustand';

// Strategy Pattern for drone color classification
class DroneColorStrategy {
  static getColor(registration) {
    if (!registration || typeof registration !== 'string') {
      return 'red'; // Default color for undefined or invalid registration
    }
    return registration.startsWith('B') ? 'green' : 'red';
  }
}

// Observer Pattern for WebSocket data handling
class DroneDataObserver {
  constructor(store) {
    this.store = store;
  }

  update(data) {
    this.store.getState().updateDrones(data);
  }
}

const useDroneStore = create((set, get) => ({
  // State
  drones: new Map(), // Using Map for better performance with large datasets
  dronePaths: new Map(), // Store flight paths for each drone
  selectedDroneId: null,
  isConnected: false,
  lastUpdate: null,
  
  // Actions
  updateDrones: (data) => {
    const currentTime = Date.now();
    const newDrones = new Map(get().drones);
    const newPaths = new Map(get().dronePaths);
    
    // Handle both array format (mock data) and featureCollection format
    const drones = Array.isArray(data) ? data : data.features || [];
    
    drones.forEach(drone => {
      // Handle both mock drone format and GeoJSON feature format
      const droneId = drone.id || drone.properties?.serial;
      const position = drone.position || {
        lat: drone.geometry?.coordinates[1],
        lng: drone.geometry?.coordinates[0],
        altitude: drone.geometry?.coordinates[2] || drone.properties?.altitude
      };
      
      // Update drone data
      const existingDrone = newDrones.get(droneId);
      const droneData = {
        id: droneId,
        name: drone.name || drone.properties?.name || `Drone ${droneId}`,
        status: drone.status || drone.properties?.status || 'FLYING',
        color: drone.color || DroneColorStrategy.getColor(drone.registration || drone.properties?.registration),
        position: position,
        latitude: position.lat,
        longitude: position.lng,
        altitude: position.altitude || 0,
        yaw: drone.yaw || drone.properties?.yaw || 0,
        speed: drone.speed || drone.properties?.speed || 0,
        battery: drone.battery || drone.properties?.battery || 100,
        signal: drone.signal || drone.properties?.signal || 100,
        lastSeen: currentTime,
        firstSeen: existingDrone?.firstSeen || currentTime,
        flightTime: existingDrone ? currentTime - existingDrone.firstSeen : 0,
        lastUpdate: drone.lastUpdate || new Date().toISOString()
      };
      
      newDrones.set(droneId, droneData);
      
      // Update flight path
      const existingPath = newPaths.get(droneId) || [];
      existingPath.push({
        coordinates: [position.lng, position.lat, position.altitude],
        timestamp: currentTime
      });
      
      // Keep only last 100 points for performance
      if (existingPath.length > 100) {
        existingPath.shift();
      }
      
      newPaths.set(droneId, existingPath);
    });
    
    set({ 
      drones: newDrones, 
      dronePaths: newPaths,
      lastUpdate: currentTime 
    });
  },
  
  selectDrone: (droneId) => {
    set({ selectedDroneId: droneId });
  },
  
  clearSelection: () => {
    set({ selectedDroneId: null });
  },
  
  setConnectionStatus: (status) => {
    set({ isConnected: status });
  },
  
  // Computed values
  getActiveDrones: () => {
    const drones = get().drones;
    return Array.from(drones.values());
  },
  
  getRedDronesCount: () => {
    const drones = get().drones;
    return Array.from(drones.values()).filter(drone => drone.color === 'red').length;
  },
  
  getDroneById: (id) => {
    return get().drones.get(id);
  },
  
  getDronePath: (id) => {
    return get().dronePaths.get(id) || [];
  },
  
  // Statistics for dashboard
  getStatistics: () => {
    const drones = Array.from(get().drones.values());
    if (drones.length === 0) return null;
    
    const altitudes = drones.map(d => d.altitude);
    return {
      totalDrones: drones.length,
      redDrones: drones.filter(d => d.color === 'red').length,
      greenDrones: drones.filter(d => d.color === 'green').length,
      averageAltitude: altitudes.reduce((a, b) => a + b, 0) / altitudes.length,
      maxAltitude: Math.max(...altitudes),
      minAltitude: Math.min(...altitudes)
    };
  }
}));

export { useDroneStore, DroneDataObserver };
export default useDroneStore;