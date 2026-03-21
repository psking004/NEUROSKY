import { randomUUID } from 'crypto';
import { z } from 'zod';

export const DroneMode = {
  MANUAL: 'manual',
  AUTONOMOUS: 'autonomous'
};

const DroneSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(20),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().default(100),
  speed: z.number().min(0).max(50).default(0),
  heading: z.number().min(0).max(360).default(0),
  mode: z.nativeEnum(DroneMode).default(DroneMode.MANUAL),
  target: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional()
});

export class DroneSimulationService {
  constructor(droneCount = 0) {
    this.drones = [];
    // System starts with 0 drones by default now
  }

  addDrone(payload) {
    const drone = {
      id: randomUUID(),
      name: payload.name || `Drone-${Math.floor(Math.random() * 1000)}`,
      latitude: payload.latitude || 37.7749,
      longitude: payload.longitude || -122.4194,
      altitude: 100,
      speed: payload.speed || 0,
      heading: 0,
      mode: DroneMode.MANUAL
    };
    
    try {
        const validated = DroneSchema.parse(drone);
        this.drones.push(validated);
        return validated;
    } catch (err) {
        throw new Error(`Invalid Drone Specs: ${err.message}`);
    }
  }

  removeDrone(id) {
    this.drones = this.drones.filter(d => d.id !== id);
  }

  controlDrone(id, command) {
    const drone = this.drones.find(d => d.id === id);
    if (!drone) return;

    if (command.mode) drone.mode = command.mode;
    if (typeof command.speed === 'number') {
        drone.speed = Math.max(0, Math.min(50, command.speed));
    }

    if (drone.mode === DroneMode.MANUAL) {
      if (command.action === 'move') {
        switch (command.direction) {
          case 'up': drone.heading = 0; break;
          case 'down': drone.heading = 180; break;
          case 'left': drone.heading = 270; break;
          case 'right': drone.heading = 90; break;
        }
        // Increment speed slightly on move if it's 0
        if (drone.speed === 0) drone.speed = 5;
      } else if (command.action === 'stop') {
        drone.speed = 0;
      }
    }

    if (command.target && drone.mode === DroneMode.AUTONOMOUS) {
      drone.target = command.target;
    }
  }

  updateAndGetDrones() {
    const EARTH_RADIUS = 6378137; // Radius in meters
    const dt = 1; // 1 second tick

    this.drones.forEach(drone => {
      // 1. AUTONOMOUS STEERING (Incremental)
      if (drone.mode === DroneMode.AUTONOMOUS && drone.target) {
        const dy = drone.target.latitude - drone.latitude;
        const dx = (drone.target.longitude - drone.longitude) * Math.cos(drone.latitude * Math.PI / 180);
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 0.00005) { // Threshold for "Reached"
          drone.speed = 0;
          drone.target = null;
        } else {
            const targetHeading = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
            
            // Smoothly rotate heading towards target
            let diff = (targetHeading - drone.heading + 360) % 360;
            if (diff > 180) diff -= 360;
            drone.heading = (drone.heading + diff * 0.2 + 360) % 360; // 20% rotation per tick
            
            if (drone.speed === 0) drone.speed = 10; // Cruise if stopped
        }
      }

      // 2. KINEMATICS (Dead Reckoning)
      if (drone.speed > 0) {
        const speedInMeters = drone.speed;
        const distanceMoved = speedInMeters * dt;

        const deltaLat = (distanceMoved * Math.cos(drone.heading * Math.PI / 180)) / EARTH_RADIUS;
        const deltaLon = (distanceMoved * Math.sin(drone.heading * Math.PI / 180)) / (EARTH_RADIUS * Math.cos(drone.latitude * Math.PI / 180));

        drone.latitude += deltaLat * (180 / Math.PI);
        drone.longitude += deltaLon * (180 / Math.PI);
      }
      
      // Altitude jitter
      drone.altitude = Math.max(80, Math.min(120, drone.altitude + (Math.random() - 0.5) * 0.4));
    });

    return this.drones;
  }

  getDrones() {
    return this.drones;
  }
}
