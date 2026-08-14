import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  socket = io({
    autoConnect: false,
    auth: (cb) => cb({ token: getAccessToken() }),
    reconnection: true,
    reconnectionAttempts: Infinity,
  });
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
}

export function disconnectSocket() {
  socket?.disconnect();
}

export function resetSocket() {
  socket?.disconnect();
  socket = null;
}
