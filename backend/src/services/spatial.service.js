import { getRedisClient } from './redis.js';

const GEO_KEY = 'neurosky:drones:geo';
const DENSITY_THRESHOLD = 50;

/**
 * PRODUCTION-GRADE SPATIAL ENGINE
 * Resilient Strategy: Silent-Fail if Redis Engine is offline.
 */
export const updateSpatialIndex = async (droneId, lat, lng) => {
  const redis = getRedisClient();
  if (!redis) return false;
  
  try {
    await redis.geoadd(GEO_KEY, lng, lat, droneId);
    return true;
  } catch (err) {
    console.warn('⚠️ Spatial Indexing: Redis Fail - Tracking sector disabled.');
    return false;
  }
};

export const getDronesInRadius = async (lat, lng, radiusKm = 5) => {
  const redis = getRedisClient();
  if (!redis) return [];
  
  try {
    const nearby = await redis.georadius(GEO_KEY, lng, lat, radiusKm, 'km', 'WITHDIST', 'WITHCOORD');
    return nearby.map(([id, dist, coord]) => ({
      id,
      distance: parseFloat(dist),
      lng: parseFloat(coord[0]),
      lat: parseFloat(coord[1])
    }));
  } catch (err) {
    return [];
  }
};

export const checkTrafficDensity = async (lat, lng, radiusKm = 1) => {
  const drones = await getDronesInRadius(lat, lng, radiusKm);
  return {
    isCongested: drones.length > DENSITY_THRESHOLD,
    droneCount: drones.length,
    limit: DENSITY_THRESHOLD
  };
};
