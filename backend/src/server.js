import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifySocketIo from 'fastify-socket.io';

import { env } from './config/env.js';
import { tokenBucketRateLimit } from './middleware/rate-limiter.js';
import * as authService from './services/auth-drone.service.js';
import { setupTelemetry } from './socket/telemetry.js';

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

// Telemetry Core Initialization
fastify.ready((err) => {
  if (err) throw err;
  setupTelemetry(fastify);
  fastify.log.info('🛡️ NeuroSky Secure Telemetry Radar Active');
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
    await fastify.listen({ port: parseInt(env.PORT, 10), host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
