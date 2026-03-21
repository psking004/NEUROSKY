import { socketAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';
import { DroneSimulationService, DroneMode } from '../services/droneService.js';
import { CollisionDetectionService } from '../services/collisionService.js';
import { Alert } from '../models/index.js';
import { z } from 'zod';
import mongoose from 'mongoose';

const ControlSchema = z.object({
  droneId: z.string().uuid(),
  command: z.object({
    mode: z.nativeEnum(DroneMode).optional(),
    action: z.enum(['move', 'stop']).optional(),
    direction: z.enum(['up', 'down', 'left', 'right']).optional(),
    speed: z.number().min(0).max(50).optional(),
    target: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    }).optional()
  })
});

const AddDroneSchema = z.object({
    name: z.string().min(1).max(20),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    speed: z.number().min(0).max(50)
});

const TargetSchema = z.object({
    droneId: z.string().uuid(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
});

export const setupSocketHandlers = (io) => {
  io.use(socketAuth); 

  const droneService = new DroneSimulationService(0); // Explicit 0
  const collisionService = new CollisionDetectionService(env.WARNING_THRESHOLD, env.CRITICAL_THRESHOLD);

  logger.info('Initializing Secure Drone Simulation Engine');

  const broadcastUpdate = async () => {
    try {
      const drones = droneService.updateAndGetDrones();
      const alerts = collisionService.checkCollisions(drones);

      droneService.applyAvoidance?.(alerts);

      io.emit('drones:update', { 
        timestamp: Date.now(), 
        drones: droneService.getDrones() 
      });

      if (alerts.length > 0) {
        io.emit('collision:alert', { timestamp: Date.now(), alerts });
        
        if (mongoose.connection.readyState === 1) {
          const persistentAlerts = alerts
            .filter(a => a.severity === 'critical')
            .map(a => ({ ...a, timestamp: new Date(a.timestamp) }));
          if (persistentAlerts.length > 0) {
            Alert.insertMany(persistentAlerts).catch(e => logger.error('Alert persistence failed', { error: e.message }));
          }
        }
      }
    } catch (error) {
      logger.error('Tick processing failure', { error: error.message });
    }
  };

  const timer = setInterval(broadcastUpdate, env.UPDATE_INTERVAL);

  io.on('connection', (socket) => {
    logger.info('Operator uplink secured', { uid: socket.user?._id });
    
    // Initial Sync
    socket.emit('drones:update', {
      timestamp: Date.now(),
      drones: droneService.getDrones()
    });

    // Deploy Asset with Payload
    socket.on('drone:add', (data) => {
        try {
            const validated = AddDroneSchema.parse(data);
            const drone = droneService.addDrone(validated);
            logger.info('Drone deployed successfully', { name: drone.name });
            io.emit('drones:update', { timestamp: Date.now(), drones: droneService.getDrones() });
        } catch (err) {
            logger.warn('Add drone failed: Invalid specs', { error: err.message });
        }
    });

    socket.on('drone:remove', (data) => {
        if (data?.droneId) {
            droneService.removeDrone(data.droneId);
            io.emit('drones:update', { timestamp: Date.now(), drones: droneService.getDrones() });
        }
    });

    socket.on('drone:control', (data) => {
      try {
        const validatedPayload = ControlSchema.parse(data);
        droneService.controlDrone(validatedPayload.droneId, validatedPayload.command);
      } catch (err) {
        logger.warn('Invalid control payload', { error: err.message });
      }
    });

    socket.on('drone:setTarget', (data) => {
        try {
            const { droneId, latitude, longitude } = TargetSchema.parse(data);
            droneService.controlDrone(droneId, { 
                mode: DroneMode.AUTONOMOUS, 
                target: { latitude, longitude } 
            });
        } catch (err) {
            logger.warn('Invalid target location', { error: err.message });
        }
    });

    socket.on('disconnect', (reason) => {
      logger.info('Operator disconnected', { uid: socket.user?._id, reason });
    });
  });

  return () => clearInterval(timer);
};
