import Redis from 'ioredis';
import { env } from '../config/env.js';

let redisClient = null;
let isRedisAvailable = false;
let redisLoggedFailure = false;

// IN-MEMORY FALLBACK STORE
const memoryStore = new Map();

/**
 * PRODUCTION-GRADE RESILIENT REDIS
 * Fixed: Aggressive retry loop and log spamming removed.
 */
const initRedis = () => {
  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      // Fixed: Slow retry strategy to prevent log spamming (Every 60 seconds)
      retryStrategy: (times) => {
        if (!redisLoggedFailure) {
          console.warn('⚠️ NEUROSKY: Redis Uplink Unavailable - Falling back to local memory mode.');
          redisLoggedFailure = true;
        }
        return 60000; // Retry only once per minute
      }
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      redisLoggedFailure = false; // Reset on successful link
      console.log('✅ NEUROSKY: Redis Uplink Restored.');
    });

    redisClient.on('error', (err) => {
      isRedisAvailable = false;
      if (!redisLoggedFailure) {
        console.warn(`⚠️ NEUROSKY: Redis Connection Failure [${err.code}] - Switched to Fallback Mode.`);
        redisLoggedFailure = true;
      }
    });

    // Initial connection attempt (Non-blocking)
    redisClient.connect().catch(() => {
      // Handled by error listeners
    });

  } catch (err) {
    if (!redisLoggedFailure) {
      console.error('❌ CRITICAL: Redis Initialization Failed. Forced Fallback Mode.');
      redisLoggedFailure = true;
    }
    isRedisAvailable = false;
  }
};

initRedis();

export const getRedisClient = () => (isRedisAvailable ? redisClient : null);

export const redisProxy = {
  hset: async (key, field, value) => {
    if (isRedisAvailable) {
      try {
        return await redisClient.hset(key, field, value);
      } catch (e) {
        isRedisAvailable = false;
      }
    }
    
    // Memory Fallback
    if (!memoryStore.has(key)) memoryStore.set(key, {});
    memoryStore.get(key)[field] = value;
    return 1;
  },
  
  publish: async (channel, message) => {
    if (isRedisAvailable) {
      try {
        return await redisClient.publish(channel, message);
      } catch (e) {
        isRedisAvailable = false;
      }
    }
    return 0;
  },

  duplicate: () => {
    if (isRedisAvailable) return redisClient.duplicate();
    return null;
  }
};

export { isRedisAvailable };
