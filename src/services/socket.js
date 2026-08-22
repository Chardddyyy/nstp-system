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

  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    auth: { token: token ? `Bearer ${token}` : null },
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 2000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('[Socket.io] 🟢 Real-time connection established to:', serverUrl);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket.io] 🟡 Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket.io] ⚠️ Connection notice (auto-retrying):', err.message);
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
    socket.disconnect();
    socket = null;
  }
}
