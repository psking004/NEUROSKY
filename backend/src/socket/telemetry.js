import { getRedisClient, redisProxy } from '../services/redis.js';
import * as spatialService from '../services/spatial.service.js';

const TELEMETRY_CHANNEL = 'neurosky:telemetry';
const DRONE_STATE_KEY = 'neurosky:drones:state';

export const setupTelemetry = (fastify) => {
  const io = fastify.io;
  const redis = getRedisClient();

  // --- REDIS PUB/SUB SYNC ---
  if (redis) {
    try {
      const subRedis = redis.duplicate();
      subRedis.subscribe(TELEMETRY_CHANNEL);
      subRedis.on('message', (channel, message) => {
        if (channel === TELEMETRY_CHANNEL) {
          const { droneId, position } = JSON.parse(message);
          io.to(`tracking:${droneId}`).emit('position_update', { droneId, position, timestamp: Date.now() });
          io.to('global:dashboard').emit('global_sync', { droneId, position });
        }
      });
      console.log('📡 Redis Subscribed: Cross-Instance Cluster Sync Online.');
    } catch (err) {
      console.warn('⚠️ Telemetry Sub-Engine Failed: Switching to Local-Only Propagation.');
    }
  }

  io.on('connection', (socket) => {
    socket.on('join_tracking', (droneId) => socket.join(`tracking:${droneId}`));
    socket.on('join_dashboard', () => socket.join('global:dashboard'));

    socket.on('drone_telemetry', async (payload) => {
      const { droneId, lat, lng, alt, heading, battery } = payload;
      const position = { lat, lng, alt, heading, battery };

      // 1. Persist current state
      await redisProxy.hset(DRONE_STATE_KEY, droneId, JSON.stringify({ ...position, lastUpdated: Date.now() }));

      // 2. Spatial Engine Integration
      try {
        await spatialService.updateSpatialIndex(droneId, lat, lng);
        const density = await spatialService.checkTrafficDensity(lat, lng, 1);
        if (density.isCongested) {
          socket.emit('safety_alert', { type: 'CONGESTED_AIRSPACE', count: density.droneCount });
        }
      } catch (err) {
        // Spatial engine fails silently if Redis is down
      }

      // 3. BROADCAST
      const telemetryStr = JSON.stringify({ droneId, position });
      
      // Local instance immediate broadcast
      io.to(`tracking:${droneId}`).emit('position_update', { droneId, position, timestamp: Date.now() });
      io.to('global:dashboard').emit('global_sync', { droneId, position });

      // Cross-instance broadcast (via Redis Pub/Sub if available)
      await redisProxy.publish(TELEMETRY_CHANNEL, telemetryStr);
    });
  });
};
