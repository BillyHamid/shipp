import { Logger } from '@nestjs/common'
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import type { Server, Socket } from 'socket.io'
import { WS_EVENTS, WS_NAMESPACES } from '@gsg/shared-types/events'
import { PrismaService } from '../../common/prisma/prisma.service.js'

/**
 * Public, unauthenticated realtime channel for the customer tracking page.
 * A client subscribes to exactly one tracking number's room — we verify the
 * parcel exists before joining, so a bogus tracking number can't be used to
 * probe for existence via room-join side channels either.
 */
@WebSocketGateway({
  namespace: WS_NAMESPACES.TRACK,
  cors: { origin: true },
})
export class TrackGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server
  private readonly logger = new Logger(TrackGateway.name)

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    this.logger.debug(`Track client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Track client disconnected: ${client.id}`)
  }

  @SubscribeMessage(WS_EVENTS.TRACK_SUBSCRIBE)
  async onSubscribe(@ConnectedSocket() client: Socket, @MessageBody() body: { trackingNumber: string }) {
    const exists = await this.prisma.parcel.findUnique({
      where: { trackingNumber: body.trackingNumber },
      select: { id: true },
    })
    if (!exists) return // silently ignore — don't leak existence via ack
    client.join(`track:${body.trackingNumber}`)
  }

  @SubscribeMessage(WS_EVENTS.TRACK_UNSUBSCRIBE)
  onUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() body: { trackingNumber: string }) {
    client.leave(`track:${body.trackingNumber}`)
  }

  broadcastUpdate(trackingNumber: string, currentState: string) {
    this.server.to(`track:${trackingNumber}`).emit(WS_EVENTS.TRACK_UPDATE, {
      trackingNumber,
      currentState,
      occurredAt: new Date().toISOString(),
    })
  }
}
