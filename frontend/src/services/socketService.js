import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connected = false;
  }

  connect() {
    if (this.socket) return this.socket;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      this.notifyListeners('connect');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      this.notifyListeners('disconnect');
    });

    this.socket.on('drone:update', (data) => {
      this.notifyListeners('drone:update', data);
    });

    this.socket.on('collision:alert', (data) => {
      this.notifyListeners('collision:alert', data);
    });

    this.socket.on('connect_error', (error) => {
      this.notifyListeners('error', error);
    });

    return this.socket;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const index = this.listeners.get(event).indexOf(callback);
    if (index > -1) {
      this.listeners.get(event).splice(index, 1);
    }
  }

  notifyListeners(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach((cb) => cb(data));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }
}

export const socketService = new SocketService();
