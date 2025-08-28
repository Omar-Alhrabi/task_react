// Performance testing utility for drone tracking application
// This module generates mock drone data to test application performance

class PerformanceTestGenerator {
  constructor() {
    this.droneCount = 0;
    this.updateInterval = null;
    this.isRunning = false;
  }

  // Generate random coordinates within Jordan bounds
  generateRandomCoordinates() {
    const jordanBounds = {
      north: 33.3736,
      south: 29.1858,
      east: 39.3012,
      west: 34.9226
    };

    return [
      jordanBounds.west + Math.random() * (jordanBounds.east - jordanBounds.west),
      jordanBounds.south + Math.random() * (jordanBounds.north - jordanBounds.south)
    ];
  }

  // Generate a single mock drone
  generateMockDrone(id) {
    const coordinates = this.generateRandomCoordinates();
    const registration = Math.random() > 0.3 ? `G${id.toString().padStart(4, '0')}` : `B${id.toString().padStart(4, '0')}`;
    
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: coordinates
      },
      properties: {
        serial: `DRONE_${id}`,
        registration: registration,
        altitude: Math.random() * 500 + 50, // 50-550 meters
        speed: Math.random() * 30 + 5, // 5-35 m/s
        yaw: Math.random() * 360, // 0-360 degrees
        latitude: coordinates[1],
        longitude: coordinates[0],
        timestamp: Date.now()
      }
    };
  }

  // Generate mock drone collection
  generateMockDroneCollection(count) {
    const features = [];
    for (let i = 1; i <= count; i++) {
      features.push(this.generateMockDrone(i));
    }

    return {
      type: 'FeatureCollection',
      features: features
    };
  }

  // Update existing drones with new positions (simulate movement)
  updateDronePositions(existingCollection) {
    return {
      ...existingCollection,
      features: existingCollection.features.map(drone => {
        const currentCoords = drone.geometry.coordinates;
        // Small random movement
        const newCoords = [
          currentCoords[0] + (Math.random() - 0.5) * 0.001, // ~100m movement
          currentCoords[1] + (Math.random() - 0.5) * 0.001
        ];

        return {
          ...drone,
          geometry: {
            ...drone.geometry,
            coordinates: newCoords
          },
          properties: {
            ...drone.properties,
            altitude: Math.max(50, Math.min(550, drone.properties.altitude + (Math.random() - 0.5) * 20)),
            speed: Math.max(5, Math.min(35, drone.properties.speed + (Math.random() - 0.5) * 5)),
            yaw: (drone.properties.yaw + (Math.random() - 0.5) * 30) % 360,
            latitude: newCoords[1],
            longitude: newCoords[0],
            timestamp: Date.now()
          }
        };
      })
    };
  }

  // Start performance test with specified drone count
  startPerformanceTest(droneCount, updateIntervalMs = 1000, onUpdate = null) {
    if (this.isRunning) {
      console.warn('Performance test is already running');
      return;
    }

    this.droneCount = droneCount;
    this.isRunning = true;

    console.log(`🚁 Starting performance test with ${droneCount} drones`);
    console.log(`📊 Update interval: ${updateIntervalMs}ms`);

    // Generate initial drone data
    let currentDroneData = this.generateMockDroneCollection(droneCount);
    
    // Send initial data
    if (onUpdate) {
      onUpdate(currentDroneData);
    }

    // Start periodic updates
    this.updateInterval = setInterval(() => {
      if (!this.isRunning) return;

      // Update drone positions
      currentDroneData = this.updateDronePositions(currentDroneData);
      
      // Measure performance
      const startTime = performance.now();
      
      if (onUpdate) {
        onUpdate(currentDroneData);
      }
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      // Log performance metrics every 10 updates
      if (Math.random() < 0.1) {
        console.log(`⚡ Update processed in ${updateTime.toFixed(2)}ms for ${droneCount} drones`);
      }
      
    }, updateIntervalMs);

    return {
      stop: () => this.stopPerformanceTest(),
      getDroneCount: () => this.droneCount,
      isRunning: () => this.isRunning
    };
  }

  // Stop performance test
  stopPerformanceTest() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Performance test stopped');
  }

  // Memory usage monitoring
  monitorMemoryUsage() {
    if (performance.memory) {
      const memory = performance.memory;
      console.log('💾 Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }
  }

  // Performance benchmarks
  runBenchmarks() {
    const benchmarks = [
      { name: '100 Drones', count: 100 },
      { name: '500 Drones', count: 500 },
      { name: '1000 Drones', count: 1000 },
      { name: '2000 Drones', count: 2000 },
      { name: '5000 Drones', count: 5000 }
    ];

    console.log('🏁 Starting performance benchmarks...');
    
    benchmarks.forEach((benchmark, index) => {
      setTimeout(() => {
        console.log(`\n📈 Benchmark: ${benchmark.name}`);
        this.monitorMemoryUsage();
        
        const startTime = performance.now();
        const mockData = this.generateMockDroneCollection(benchmark.count);
        const endTime = performance.now();
        
        console.log(`⏱️  Data generation time: ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`📦 Data size: ${JSON.stringify(mockData).length} characters`);
        
        this.monitorMemoryUsage();
      }, index * 2000); // 2 second delay between benchmarks
    });
  }
}

// Export singleton instance
const performanceTestGenerator = new PerformanceTestGenerator();
export default performanceTestGenerator;

// Export class for custom instances
export { PerformanceTestGenerator };

// Utility functions for quick testing
export const quickTests = {
  // Test with 1000 drones for 30 seconds
  test1000Drones: (onUpdate) => {
    return performanceTestGenerator.startPerformanceTest(1000, 500, onUpdate);
  },
  
  // Test with 5000 drones for stress testing
  stressTest: (onUpdate) => {
    return performanceTestGenerator.startPerformanceTest(5000, 1000, onUpdate);
  },
  
  // Memory benchmark
  memoryBenchmark: () => {
    performanceTestGenerator.runBenchmarks();
  }
};