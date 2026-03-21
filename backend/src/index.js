import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { setupSocketHandlers } from './socket/index.js';
import { authMiddleware } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import logger from './utils/logger.js';

const app = express();

// Database Connectivity (Fire and forget, non-blocking)
connectDB();

// Global Middlewares
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors({ 
  origin: env.CORS_ORIGIN, 
  credentials: true 
}));

// Request Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
});
app.use('/api/', limiter);

// Routing
app.use('/api/auth', authRouter);

// Health Monitoring with DB status
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'HEALTHY', 
    database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'STANDALONE_MODE',
    timestamp: new Date().toISOString() 
  });
});

// Centralized Error Handling
app.use((err, req, res, next) => {
  logger.error('Unhandled application exception', { error: err.message, stack: err.stack });
  res.status(500).json({ status: 'ERROR', message: 'Internal Server Error' });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

setupSocketHandlers(io);

server.listen(env.PORT, () => {
  logger.info(`🚀 NeuroSky Service listening on port ${env.PORT} [ENV: ${env.NODE_ENV}]`);
  if (env.NODE_ENV === 'development') {
    logger.info('💡 Standalone Mock Login enabled: Send any request to /api/auth/login if DB is down');
  }
});
