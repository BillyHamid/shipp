import { Logger, UseGuards } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import type { Server, Socket } from 'socket.io'
import { WS_EVENTS, WS_NAMESPACES } from '@gsg/shared-types/events'
import { WsJwtGuard } from './ws-jwt.guard.js'

/**
 * Admin-facing realtime channel. Requires a valid JWT (passed as
 * `auth: { token }` in the client handshake — WS has no header convention
 * as reliable as HTTP's Authorization header across all transports).
 *
 * Rooms:
 *   admin:dashboard         — all connected admins, for KPI invalidation
 *   parcel:{trackingNumber} — anyone viewing that parcel's detail page
 */
@WebSocketGateway({
  namespace: WS_NAMESPACES.ADMIN,
  cors: { origin: true, credentials: true },
})
export class AdminGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server
  private readonly logger = new Logger(AdminGateway.name)

  handleConnection(client: Socket) {
    client.join('admin:dashboard')
    this.logger.debug(`Admin client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Admin client disconnected: ${client.id}`)
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('parcel:watch')
  onWatchParcel(@ConnectedSocket() client: Socket, @MessageBody() body: { trackingNumber: string }) {
    client.join(`parcel:${body.trackingNumber}`)
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('parcel:unwatch')
  onUnwatchParcel(@ConnectedSocket() client: Socket, @MessageBody() body: { trackingNumber: string }) {
    client.leave(`parcel:${body.trackingNumber}`)
  }

  broadcastParcelUpdated(trackingNumber: string, payload: unknown) {
    this.server.to(`parcel:${trackingNumber}`).emit(WS_EVENTS.PARCEL_UPDATED, payload)
  }

  broadcastDashboardInvalidate(reason: string) {
    this.server.to('admin:dashboard').emit(WS_EVENTS.DASHBOARD_INVALIDATE, { reason })
  }

  broadcastBoxUpdated(payload: unknown) {
    this.server.to('admin:dashboard').emit(WS_EVENTS.BOX_UPDATED, payload)
  }
}
