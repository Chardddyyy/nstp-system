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
    transports: ['polling', 'websocket'],
    upgrade: true,
    autoConnect: true,
    auth: { token: token ? `Bearer ${token}` : null },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 3000,
    timeout: 25000,
  });

  socket.on('connect', () => {
    // Connected
  });

  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      socket.connect();
    }
  });

  socket.on('connect_error', () => {
    // Handled gracefully without noisy console errors
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
