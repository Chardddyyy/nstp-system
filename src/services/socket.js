import { io } from 'socket.io-client';
import { getPrimaryApiUrl } from './api';

let socket = null;

export function getSocketServerUrl() {
  const apiUrl = getPrimaryApiUrl();
  // Strip '/api' from URL to get the root socket server endpoint
  return apiUrl.replace(/\/api\/?$/, '');
}

export function initSocket() {
  if (typeof window === 'undefined') return null;

  const serverUrl = getSocketServerUrl();
  const token = localStorage.getItem('nstp_token');

  if (socket && (socket.connected || socket.connecting || socket.active)) {
    return socket;
  }

  if (socket) {
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch (_) {}
    socket = null;
  }

  socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    upgrade: true,
    autoConnect: true,
    auth: { token: token ? `Bearer ${token}` : null },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2500,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.5,
    timeout: 20000,
  });

  socket.on('connect', () => {
    // Successfully connected
  });

  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect' && socket) {
      setTimeout(() => {
        if (socket && !socket.connected) {
          socket.connect();
        }
      }, 2000);
    }
  });

  socket.on('connect_error', () => {
    // Handled gracefully during server restarts or cold starts
  });

  socket.on('error', () => {
    // Handled gracefully
  });

  return socket;
}

export function getSocket() {
  if (!socket) {
    return initSocket();
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch (_) {}
    socket = null;
  }
}

