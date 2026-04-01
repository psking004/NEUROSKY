import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifySocketIo from 'fastify-socket.io';

import { env } from './config/env.js';
import { tokenBucketRateLimit } from './middleware/rate-limiter.js';
import * as authService from './services/auth-drone.service.js';
import { DroneSimulationService, DroneMode } from './services/droneService.js';
import { CollisionDetectionService } from './services/collisionService.js';
import { z } from 'zod';

// Global Crash Prevention: Catch all unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('💣 [CRITICAL ERROR]: UNHANDLED REJECTION', { reason, promise });
});

process.on('uncaughtException', (err, origin) => {
  console.error('🧨 [CRITICAL ERROR]: UNCAUGHT EXCEPTION', { error: err.message, origin });
});


const fastify = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss Z' },
    },
  },
});

// Hardened Global Middleware
fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://*"],
    },
  },
});

fastify.register(cors, {
  origin: env.NODE_ENV === 'production' ? ['https://sky-utm.neurosky.io'] : '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

fastify.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  sign: { algorithm: 'HS256', expiresIn: env.ACCESS_TOKEN_EXPIRE + 's' }
});

fastify.register(fastifySocketIo, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// --- Validation Schemas ---
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

// --- Drone Simulation Core ---
fastify.ready((err) => {
  if (err) throw err;

  const io = fastify.io;
  const droneService = new DroneSimulationService(0);
  const collisionService = new CollisionDetectionService(500, 200);

  fastify.log.info('🛡️ NeuroSky Simulation Engine Active');

  // Broadcast drone updates every second
  const broadcastUpdate = () => {
    try {
      const drones = droneService.updateAndGetDrones();
      const alerts = collisionService.checkCollisions(drones);

      io.emit('drones:update', {
        timestamp: Date.now(),
        drones: droneService.getDrones()
      });

      if (alerts.length > 0) {
        io.emit('collision:alert', { timestamp: Date.now(), alerts });
      }
    } catch (error) {
      fastify.log.error('Tick processing failure: ' + error.message);
    }
  };

  const timer = setInterval(broadcastUpdate, 1000);

  // Socket connection handler
  io.on('connection', (socket) => {
    fastify.log.info('Operator uplink secured: ' + (socket.id));

    // Initial Sync
    socket.emit('drones:update', {
      timestamp: Date.now(),
      drones: droneService.getDrones()
    });

    // Deploy drone
    socket.on('drone:add', (data) => {
      try {
        const validated = AddDroneSchema.parse(data);
        const drone = droneService.addDrone(validated);
        fastify.log.info('Drone deployed: ' + drone.name);
        io.emit('drones:update', { timestamp: Date.now(), drones: droneService.getDrones() });
      } catch (err) {
        fastify.log.warn('Add drone failed: ' + err.message);
        socket.emit('error', { message: 'Invalid drone specs' });
      }
    });

    // Remove drone
    socket.on('drone:remove', (data) => {
      if (data?.droneId) {
        droneService.removeDrone(data.droneId);
        io.emit('drones:update', { timestamp: Date.now(), drones: droneService.getDrones() });
      }
    });

    // Control drone (manual move/stop, speed, mode)
    socket.on('drone:control', (data) => {
      try {
        const validatedPayload = ControlSchema.parse(data);
        droneService.controlDrone(validatedPayload.droneId, validatedPayload.command);
      } catch (err) {
        fastify.log.warn('Invalid control payload: ' + err.message);
      }
    });

    // Set autonomous target
    socket.on('drone:setTarget', (data) => {
      try {
        const { droneId, latitude, longitude } = TargetSchema.parse(data);
        droneService.controlDrone(droneId, {
          mode: DroneMode.AUTONOMOUS,
          target: { latitude, longitude }
        });
      } catch (err) {
        fastify.log.warn('Invalid target location: ' + err.message);
      }
    });

    socket.on('disconnect', (reason) => {
      fastify.log.info('Operator disconnected: ' + reason);
    });
  });
});

// Security Hooks
fastify.addHook('onRequest', tokenBucketRateLimit);

fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'RESTRICTED', message: 'Aviation ID authentication failure.' });
  }
});

// Health Check
fastify.get('/health', async () => ({ status: 'OPTIMAL', platform: 'NEUROSKY_UTM' }));

// AUTH ROUTES
fastify.post('/api/auth/register', async (request, reply) => {
  const { email, password, role } = request.body;
  try {
    const user = await authService.registerUser(email, password, role);
    reply.send({ status: 'SUCCESS', user });
  } catch (err) {
    reply.status(400).send({ error: 'Registration failed', message: err.message });
  }
});

fastify.post('/api/auth/login', async (request, reply) => {
  const { email, password } = request.body;
  const user = await authService.loginUser(email, password);
  
  if (!user) {
    return reply.status(401).send({ error: 'UNAUTHORIZED', code: 'UTM_ERR_401' });
  }
  
  const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role });
  return { status: 'SUCCESS', token, user };
});

// DRONE REGISTRY
fastify.register(async (instance) => {
  instance.addHook('preHandler', instance.authenticate);

  instance.post('/api/drones/register', async (request, reply) => {
    const { serialNumber, model, manufacturer } = request.body;
    try {
      const drone = await authService.registerDrone(serialNumber, model, request.user.id, manufacturer);
      reply.send({ status: 'SUCCESS', drone });
    } catch (err) {
      reply.status(400).send({ error: 'Drone Registration Failed', message: err.message });
    }
  });

  instance.get('/api/drones', async (request, reply) => {
    const drones = await authService.getAllDrones();
    return { status: 'SUCCESS', drones };
  });
});

const start = async () => {
  try {
    // Graceful Shutdown Handler
    ['SIGINT', 'SIGTERM'].forEach(signal => {
      process.on(signal, async () => {
        fastify.log.info(`Received ${signal}, shutting down gracefully...`);
        try {
          await fastify.close();
          fastify.log.info('Server closed');
          process.exit(0);
        } catch (err) {
          fastify.log.error('Error during shutdown', err);
          process.exit(1);
        }
      });
    });

    await fastify.listen({ port: parseInt(env.PORT, 10), host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
