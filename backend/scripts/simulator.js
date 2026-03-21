import { io } from 'socket.io-client';
import { nanoid } from 'nanoid';

const NUM_DRONES = 1000;
const SERVER_URL = 'http://localhost:3000';
const UPDATE_INTERVAL_MS = 1000;

console.log(`🚀 NEUROSKY - LAUNCHING SWARM SIMULATION (${NUM_DRONES} DRONES)`);

function createDrone(id) {
  const socket = io(SERVER_URL, {
    transports: ['websocket'],
    reconnection: true
  });

  let lat = 37.7749 + (Math.random() - 0.5) * 0.1;
  let lng = -122.4194 + (Math.random() - 0.5) * 0.1;
  let alt = 100 + Math.random() * 50;
  let heading = Math.random() * 360;

  socket.on('connect', () => {
    console.log(`Drone ${id} Linked to UTM`);
    
    // Start High-Frequency Telemetry Loop
    setInterval(() => {
      // Simulate flight physics
      lat += (Math.random() - 0.5) * 0.0001;
      lng += (Math.random() - 0.5) * 0.0001;
      heading = (heading + (Math.random() - 0.5) * 5) % 360;

      socket.emit('drone_telemetry', {
        droneId: id,
        lat,
        lng,
        alt,
        heading,
        battery: 80 + Math.random() * 20,
        velocity: 10 + Math.random() * 5
      });
    }, UPDATE_INTERVAL_MS);
  });

  socket.on('safety_alert', (alert) => {
    console.warn(`Drone ${id} Alert:`, alert.type);
  });
}

// Spin up the swarm
for (let i = 0; i < NUM_DRONES; i++) {
  const droneId = '550e8400-e29b-41d4-a716-446655440000'.replace(/4/g, i % 10); // Simple deterministic UUIDs
  setTimeout(() => createDrone(droneId), i * 10); // Stagger connections to prevent connection flood
}

process.on('SIGINT', () => {
  console.log('🛑 SWARM SIMULATION TERMINATED');
  process.exit();
});
