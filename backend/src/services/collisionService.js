export class CollisionDetectionService {
  constructor(warningThreshold = 500, criticalThreshold = 200) {
    this.warningThreshold = warningThreshold;
    this.criticalThreshold = criticalThreshold;
  }

  checkCollisions(drones) {
    const alerts = [];
    
    // Bounding Box Pruning (O(1) logic, huge constant factor speedup)
    // 0.015 deg lat ~ 1600 meters. 0.02 deg lon ~ 1600 meters at mid-latitudes.
    const MAX_LAT_DIFF = 0.015; 
    const MAX_LON_DIFF = 0.02;
    
    // O(n^2) scaling mitigated by pre-flight spatial pruning
    for (let i = 0; i < drones.length; i++) {
        for (let j = i + 1; j < drones.length; j++) {
            const d1 = drones[i];
            const d2 = drones[j];
            
            // Fast Pruning calculation (skips heavy trig)
            if (
                Math.abs(d1.latitude - d2.latitude) > MAX_LAT_DIFF ||
                Math.abs(d1.longitude - d2.longitude) > MAX_LON_DIFF
            ) {
                continue;
            }

            const dist = this.calculateDistance(d1.latitude, d1.longitude, d2.latitude, d2.longitude);
            
            // Assume 3D consideration (altitude) is simplified into absolute distance roughly when scaled
            // but we'll stick to a 2D distance for threshold as requested 
            if (dist < this.criticalThreshold) {
                alerts.push({
                    timestamp: Date.now(),
                    severity: 'critical',
                    distance: Math.round(dist),
                    droneIds: [d1.id, d2.id]
                });
            } else if (dist < this.warningThreshold) {
                alerts.push({
                    timestamp: Date.now(),
                    severity: 'warning',
                    distance: Math.round(dist),
                    droneIds: [d1.id, d2.id]
                });
            }
        }
    }
    
    return alerts;
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // in meters
  }
}
