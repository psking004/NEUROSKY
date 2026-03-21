const SAFETY_RADIUS_METERS = 50; // Aviation standard (Separation Minima)
const PREDICTION_TIME_SECONDS = 5; // Lookahead time

/**
 * Predict future position based on current telemetry.
 */
export const predictFuturePosition = (currPos) => {
  const { lat, lng, heading, velocity = 10 } = currPos; // velocity in m/s
  // Simplified linear prediction (Spherical geometry approximation)
  const R = 6371e3; // Earth radius in meters
  const dLat = (velocity * Math.cos(heading * Math.PI / 180) * PREDICTION_TIME_SECONDS) / R;
  const dLng = (velocity * Math.sin(heading * Math.PI / 180) * PREDICTION_TIME_SECONDS) / (R * Math.cos(lat * Math.PI / 180));
  
  return {
    lat: lat + (dLat * 180 / Math.PI),
    lng: lng + (dLng * 180 / Math.PI),
    alt: currPos.alt // Simplification: constant altitude
  };
};

/**
 * Detect collision risk between two drones.
 */
export const detectCollisionRisk = (drone1, drone2) => {
  const dist = getDistance(drone1, drone2);
  return dist < SAFETY_RADIUS_METERS;
};

/**
 * Basic Haversine distance in meters.
 */
function getDistance(p1, p2) {
  const R = 6371e3;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(p1.lat*Math.PI/180) * Math.cos(p2.lat*Math.PI/180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * A* Simplified Rerouting for Collision Avoidance.
 */
export const calculateReroute = (currPos, targetPos, obstacles) => {
  // Normally complex, I'll provide a simplified 'Vector Offset' for avoidance
  // Moving away from the nearest collision risk.
  if (!obstacles || obstacles.length === 0) return targetPos;
  
  const nearest = obstacles[0];
  const offsetLat = (currPos.lat - nearest.lat) * 0.1;
  const offsetLng = (currPos.lng - nearest.lng) * 0.1;
  
  return {
    lat: targetPos.lat + offsetLat,
    lng: targetPos.lng + offsetLng,
    alt: targetPos.alt + 10 // Climb to avoid
  };
};
