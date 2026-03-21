import { getRedisClient } from '../services/redis.js';
import { env } from '../config/env.js';

const CAPACITY = parseInt(env.TOKEN_BUCKET_CAPACITY, 10) || 100;
const REFILL_RATE = parseInt(env.REFILL_RATE_PER_SECOND, 10) || 2;

// FALLBACK MEMORY STORE (Rate limiting)
const tokenBuckets = new Map();

/**
 * PRODUCTION-GRADE RATE LIMITER (Token Bucket)
 * Safe-Fail Strategy: Uses Memory if Redis Uplink is severed.
 */
export const tokenBucketRateLimit = async (request, reply) => {
  const ip = request.ip;
  const key = `rl:${ip}`;
  const now = Date.now() / 1000;
  const redis = getRedisClient();

  if (redis) {
    // 1. Redis Optimized Token Bucket (Phase 1 Redis Integration)
    try {
      const result = await redis.eval(
        `
        local key = KEYS[1]; local cap = tonumber(ARGV[1]); local rate = tonumber(ARGV[2]); local now = tonumber(ARGV[3]);
        local bucket = redis.call('HMGET', key, 't', 'l');
        local t = tonumber(bucket[1]) or cap; local l = tonumber(bucket[2]) or now;
        local d = math.max(0, now - l); t = math.min(cap, t + d * rate);
        if t >= 1 then
          redis.call('HMSET', key, 't', t - 1, 'l', now); return 1;
        else
          return 0;
        end
        `,
        1, key, CAPACITY, REFILL_RATE, now
      );

      if (result === 0) {
        return reply.status(429).send({ error: 'TOO_MANY_REQUESTS', message: 'Rate Limit Exceeded.' });
      }
      return; // Permissive
    } catch (err) {
      console.warn('⚠️ Rate Limiter Uplink Error - Using Memory Safe-Mode.');
    }
  }

  // 2. Memory Fallback Implementation
  let bucket = tokenBuckets.get(key) || { t: CAPACITY, l: now };
  let delta = Math.max(0, now - bucket.l);
  bucket.t = Math.min(CAPACITY, bucket.t + delta * REFILL_RATE);
  bucket.l = now;

  if (bucket.t >= 1) {
    bucket.t -= 1;
    tokenBuckets.set(key, bucket);
  } else {
    return reply.status(429).send({ error: 'TOO_MANY_REQUESTS', message: 'Fallback Rate Limit Violation.' });
  }
};
