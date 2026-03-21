import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function useDroneData() {
  const [drones, setDrones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDroneId, setSelectedDroneId] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const socketRef = useRef(null);

  useEffect(() => {
    // SINGLETON SOCKET INITIALIZATION
    if (socketRef.current) return;

    const token = localStorage.getItem('token');
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
      console.log('📡 Operator Uplink Established');
    });

    socket.on('connect_error', (err) => {
      setError(err.message);
      setConnected(false);
    });

    socket.on('drone:update', (data) => {
      // Functional update to avoid closure staleness
      setDrones(prevDrones => {
          // Optimization: If the number of drones hasn't changed, perform deep equality check or just replace?
          // To minimize flicker, we should ensure the object references for unchanged drones are preserved?
          // Actually, React-Leaflet handles position updates smoothly if the Marker props change.
          // The issue is likely the MapContainer or Parent re-rendering.
          return data.drones;
      });
    });

    socket.on('collision:alert', (data) => {
      setAlerts(data.alerts);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const selectDrone = useCallback((id) => {
    setSelectedDroneId(id);
  }, []);

  const addDrone = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('drone:add');
    }
  }, []);

  const removeDrone = useCallback((droneId) => {
    if (socketRef.current?.connected && droneId) {
      socketRef.current.emit('drone:remove', { droneId });
      if (selectedDroneId === droneId) setSelectedDroneId(null);
    }
  }, [selectedDroneId]);

  const controlDrone = useCallback((droneId, command) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('drone:control', { droneId, command });
    }
  }, []);

  const getDroneStatus = useCallback((droneId) => {
    const criticalAlert = alerts.find(a => a.droneIds.includes(droneId) && a.severity === 'critical');
    if (criticalAlert) return 'critical';
    const warningAlert = alerts.find(a => a.droneIds.includes(droneId));
    if (warningAlert) return 'warning';
    return 'safe';
  }, [alerts]);

  const selectedDrone = drones.find(d => d.id === selectedDroneId);

  return {
    drones,
    alerts,
    connected,
    error,
    getDroneStatus,
    selectedDroneId,
    selectedDrone,
    selectDrone,
    addDrone,
    removeDrone,
    controlDrone,
    isFollowing,
    setIsFollowing
  };
}
