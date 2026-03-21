import express from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

const router = express.Router();

// Fail-safe router for database-free operation
router.post('/register', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database disconnected. Standalone mode restricted.' });
  }

  const { email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User exists' });

    const user = await User.create({ email, password });
    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: '1d' });
    
    res.cookie('token', token, { httpOnly: true, secure: env.NODE_ENV === 'production' });
    res.json({ message: 'Success', token });
  } catch (error) {
    logger.error('Registration error', { error: error.message });
    res.status(500).json({ message: 'Operation failed' });
  }
});

router.post('/login', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    // Return a dummy token for local dev if DB is down
    if (env.NODE_ENV === 'development') {
        const token = jwt.sign({ id: 'dummy_id' }, env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({ message: 'DB Disconnected: Simulated Login Success', token });
    }
    return res.status(503).json({ message: 'Database disconnected.' });
  }

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true, secure: env.NODE_ENV === 'production' });
    res.json({ message: 'Success', token });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({ message: 'Login failed' });
  }
});

export default router;
