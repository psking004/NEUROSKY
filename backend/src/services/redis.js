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
 * Enhanced: Full try-catch and safe-fail proxy.
 */
const initRedis = () => {
  if (redisClient) return; // Already initialized

  try {
    // Check if REDIS_URL is valid/present, though Zod has a default
    if (!env.REDIS_URL) {
      console.warn('⚠️ NEUROSKY: No Redis URL defined. Starting in Local-Only Fallback Mode.');
      return;
    }

    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true, // Don't block startup
      connectTimeout: 5000, // Fail fast on initial attempt
      retryStrategy: (times) => {
        if (!redisLoggedFailure) {
          console.warn('⚠️ NEUROSKY: Redis Uplink Unavailable - Falling back to local memory mode.');
          redisLoggedFailure = true;
        }
        // Increase retry interval slightly to not flood logs/network
        return Math.min(times * 2000, 30000); 
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) return true;
        return false;
      }
    });

    // CRITICAL: Error handler MUST exist to prevent process crash
    redisClient.on('error', (err) => {
      isRedisAvailable = false;
      if (!redisLoggedFailure) {
        console.warn(`⚠️ NEUROSKY: Redis Connection Failure [${err.code || 'UNKNOWN'}] - Switched to Fallback Mode.`);
        redisLoggedFailure = true;
      }
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      redisLoggedFailure = false;
      console.log('✅ NEUROSKY: Redis Uplink Restored.');
    });

    // Silent initial connection (Non-blocking)
    redisClient.connect().catch(() => {
        // Safe catch - ioredis emits 'error' which we handle above
    });

  } catch (err) {
    console.error('❌ CRITICAL: Redis Initialization Failed. Forced Fallback Mode.', { error: err.message });
    isRedisAvailable = false;
  }
};

// Start initial scan
initRedis();

/**
 * Returns the client ONLY if it's healthy.
 */
export const getRedisClient = () => (isRedisAvailable ? redisClient : null);

/**
 * Safe Proxy for redis operations with memory fallback.
 */
export const redisProxy = {
  hset: async (key, field, value) => {
    if (isRedisAvailable && redisClient) {
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
    if (isRedisAvailable && redisClient) {
      try {
        return await redisClient.publish(channel, message);
      } catch (e) {
        isRedisAvailable = false;
      }
    }
    return 0;
  },

  duplicate: () => {
    if (isRedisAvailable && redisClient) {
        try {
            return redisClient.duplicate();
        } catch (e) {
            return null;
        }
    }
    return null;
  }
};

export { isRedisAvailable };
