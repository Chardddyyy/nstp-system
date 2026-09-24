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
    transports: ['polling', 'websocket'],
    upgrade: true,
    autoConnect: true,
    auth: { token: token ? `Bearer ${token}` : null },
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.5,
    timeout: 30000,
  });

  socket.on('connect', () => {
    // Successfully connected
  });

  socket.on('disconnect', (reason) => {
    if ((reason === 'io server disconnect' || reason === 'transport close' || reason === 'transport error') && socket) {
      setTimeout(() => {
        if (socket && !socket.connected) {
          socket.connect();
        }
      }, 1500);
    }
  });

  socket.on('connect_error', (err) => {
    // Gracefully recover when sleep/wake or network switch invalidates old session ID
    if (err && (err.message?.includes('400') || err.description === 400)) {
      setTimeout(() => {
        if (socket && !socket.connected) {
          try { socket.connect(); } catch (_) {}
        }
      }, 1000);
    }
  });

  socket.on('error', () => {
    // Handled gracefully without crashing
  });

  // Automatically reconnect on device wake or network restoration
  if (typeof window !== 'undefined' && !window.__nstp_socket_wake_listener__) {
    window.__nstp_socket_wake_listener__ = true;
    const handleWake = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        if (socket && !socket.connected) {
          try { socket.connect(); } catch (_) {}
        }
      }
    };
    window.addEventListener('online', handleWake);
    document.addEventListener('visibilitychange', handleWake);
  }

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

