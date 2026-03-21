import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';
import { User } from '../models/index.js';
import mongoose from 'mongoose';

const isDev = env.NODE_ENV === 'development';

export const authMiddleware = async (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  
  // High-availability Dev Bypass: Support simulation without DB
  if (!token && isDev && mongoose.connection.readyState !== 1) {
    req.user = { _id: 'dev_user', email: 'dev@neurosky.io' };
    return next();
  }

  if (!token) return res.status(401).json({ message: 'Authorization required' });

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
    }

    // Fallback for valid token but disconnected DB
    req.user = { _id: decoded.id, email: 'unknown@neurosky.io' };
    next();
  } catch (error) {
    logger.error('Auth failure', { error: error.message });
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const socketAuth = async (socket, next) => {
  const token = socket.handshake.auth?.token;
  
  // Dev Bypass for Socket Lifecycle
  if (!token && isDev && mongoose.connection.readyState !== 1) {
    socket.user = { _id: 'dev_user' };
    return next();
  }

  if (!token) return next(new Error('Auth error'));

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    socket.user = { _id: decoded.id };
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
};
