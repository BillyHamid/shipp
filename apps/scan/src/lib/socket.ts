import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '../stores/auth.js'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000'

let socket: Socket | null = null

/** Lazily connects (and reuses) the admin WS namespace, authenticated via JWT. */
export function getAdminSocket(): Socket {
  const auth = useAuthStore()

  if (!socket) {
    socket = io(`${WS_URL}/admin`, {
      transports: ['websocket', 'polling'],
      auth: { token: auth.accessToken },
    })
  } else if (socket.auth && (socket.auth as { token?: string }).token !== auth.accessToken) {
    // Token rotated (refresh) — reconnect with the fresh one
    socket.auth = { token: auth.accessToken }
    socket.disconnect().connect()
  }

  return socket
}

export function disconnectAdminSocket(): void {
  socket?.disconnect()
  socket = null
}
