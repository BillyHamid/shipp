import { io, type Socket } from 'socket.io-client'

/**
 * Subscribes to live updates for one tracking number over the public /track
 * WS namespace. Falls back gracefully — if the socket never connects (e.g.
 * corporate proxy blocking WS), the page still works via the SSR-fetched
 * snapshot; this is a progressive enhancement, not a hard dependency.
 */
export function useTrackingSocket(trackingNumber: string, onUpdate: (state: string) => void) {
  const config = useRuntimeConfig()
  let socket: Socket | null = null

  onMounted(() => {
    socket = io(`${config.public.wsUrl}/track`, {
      transports: ['websocket', 'polling'],
      withCredentials: false,
    })

    socket.on('connect', () => {
      socket?.emit('track:subscribe', { trackingNumber })
    })

    socket.on('track:update', (payload: { trackingNumber: string; currentState: string }) => {
      if (payload.trackingNumber === trackingNumber) {
        onUpdate(payload.currentState)
      }
    })
  })

  onBeforeUnmount(() => {
    socket?.emit('track:unsubscribe', { trackingNumber })
    socket?.disconnect()
  })
}
