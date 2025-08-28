import { DroneDataObserver } from '../stores/droneStore';

class WebSocketService {
  constructor() {
    this.observers = [];
    this.isConnected = false;
    this.mockDataInterval = null;
    this.mockDrones = this.generateMockDrones();
  }

  generateMockDrones() {
    const drones = [];
    const statuses = ['Active', 'Idle', 'Warning', 'Critical', 'Landed'];
    const droneModels = [
      'DJI Mavic 3 Pro',
      'DJI Mini 3 Pro', 
      'DJI Air 2S',
      'DJI Phantom 4',
      'Autel EVO II',
      'Skydio 2+'
    ];
    
    for (let i = 1; i <= 12; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const model = droneModels[Math.floor(Math.random() * droneModels.length)];
      
      drones.push({
        id: `drone_${i}`,
        name: `${model} ${i}`,
        status: status,
        position: {
          lat: 37.7749 + (Math.random() - 0.5) * 0.08,
          lng: -122.4194 + (Math.random() - 0.5) * 0.08,
          altitude: status === 'Landed' ? 0 : Math.random() * 400 + 50
        },
        yaw: Math.random() * 360,
        speed: status === 'Landed' ? 0 : Math.random() * 45,
        battery: status === 'Critical' ? Math.floor(Math.random() * 15) : 
                status === 'Warning' ? Math.floor(Math.random() * 30) + 15 :
                Math.floor(Math.random() * 70) + 30,
        signal: Math.floor(Math.random() * 40) + 60,
        flightTime: status === 'Landed' ? '00:00' : 
                   `${Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        lastUpdate: new Date().toISOString()
      });
    }
    return drones;
  }

  // Observer Pattern implementation
  addObserver(observer) {
    this.observers.push(observer);
  }

  removeObserver(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  notifyObservers(data) {
    this.observers.forEach(observer => observer.update(data));
  }

  updateMockDronePositions() {
    this.mockDrones = this.mockDrones.map(drone => {
      // Don't update landed drones
      if (drone.status === 'Landed') {
        return {
          ...drone,
          lastUpdate: new Date().toISOString()
        };
      }
      
      // Update flight time for active drones
      let newFlightTime = drone.flightTime;
      if (drone.status === 'Active' && Math.random() < 0.3) {
        const [minutes, seconds] = drone.flightTime.split(':').map(Number);
        const totalSeconds = minutes * 60 + seconds + 1;
        const newMinutes = Math.floor(totalSeconds / 60);
        const newSecondsOnly = totalSeconds % 60;
        newFlightTime = `${newMinutes}:${newSecondsOnly.toString().padStart(2, '0')}`;
      }
      
      return {
        ...drone,
        position: {
          ...drone.position,
          lat: drone.position.lat + (Math.random() - 0.5) * 0.0008,
          lng: drone.position.lng + (Math.random() - 0.5) * 0.0008,
          altitude: drone.status === 'Active' ? 
            Math.max(20, Math.min(500, drone.position.altitude + (Math.random() - 0.5) * 8)) :
            Math.max(10, drone.position.altitude + (Math.random() - 0.5) * 3)
        },
        yaw: (drone.yaw + (Math.random() - 0.5) * 8) % 360,
        speed: drone.status === 'Active' ? 
          Math.max(5, Math.min(50, drone.speed + (Math.random() - 0.5) * 3)) :
          Math.max(0, drone.speed + (Math.random() - 0.5) * 2),
        battery: Math.max(0, Math.min(100, drone.battery - Math.random() * 0.5)),
        signal: Math.max(30, Math.min(100, drone.signal + (Math.random() - 0.5) * 3)),
        flightTime: newFlightTime,
        lastUpdate: new Date().toISOString()
      };
    });
    
    this.notifyObservers(this.mockDrones);
  }

  connect() {
    console.log('Starting mock drone data service...');
    this.isConnected = true;
    
    // Send initial data
    this.notifyObservers(this.mockDrones);
    
    // Start updating drone positions every 2 seconds
    this.mockDataInterval = setInterval(() => {
      this.updateMockDronePositions();
    }, 2000);
    
    this.notifyConnectionStatus(true);
  }





  notifyConnectionStatus(isConnected) {
    this.observers.forEach(observer => {
      if (observer.updateConnectionStatus) {
        observer.updateConnectionStatus(isConnected);
      }
    });
  }

  disconnect() {
    if (this.mockDataInterval) {
      clearInterval(this.mockDataInterval);
      this.mockDataInterval = null;
    }
    this.isConnected = false;
    this.notifyConnectionStatus(false);
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  // Method to manually trigger reconnection
  forceReconnect() {
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }
}

// Singleton pattern
const websocketService = new WebSocketService();
export { websocketService };
export default websocketService;