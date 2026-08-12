import { Injectable, Logger } from '@nestjs/common'
import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { ParcelTransitionedDomainEvent } from '../../parcels/events/parcel-transitioned.event.js'
import { BoxUpdatedDomainEvent } from '../../boxes/events/box-updated.event.js'
import { AdminGateway } from '../admin.gateway.js'
import { TrackGateway } from '../track.gateway.js'

/**
 * Bridges domain events (published via CQRS EventBus by command handlers)
 * to WebSocket broadcasts. This keeps command handlers ignorant of
 * WebSocket/Socket.IO entirely — they just publish facts, and this
 * subscriber decides who gets notified.
 */
@Injectable()
@EventsHandler(ParcelTransitionedDomainEvent)
export class ParcelTransitionedBroadcastSubscriber
  implements IEventHandler<ParcelTransitionedDomainEvent>
{
  private readonly logger = new Logger(ParcelTransitionedBroadcastSubscriber.name)

  constructor(
    private readonly adminGateway: AdminGateway,
    private readonly trackGateway: TrackGateway,
  ) {}

  handle(evt: ParcelTransitionedDomainEvent): void {
    const { parcel, event, actorName } = evt

    this.adminGateway.broadcastParcelUpdated(parcel.trackingNumber, {
      parcelId: parcel.id,
      trackingNumber: parcel.trackingNumber,
      fromState: event.fromState,
      toState: event.toState,
      occurredAt: event.occurredAt.toISOString(),
      actorName,
    } satisfies Record<string, unknown>)

    this.adminGateway.broadcastDashboardInvalidate('parcel_change')

    this.trackGateway.broadcastUpdate(parcel.trackingNumber, parcel.currentState)

    this.logger.debug(
      `Broadcast: ${parcel.trackingNumber} ${event.fromState} → ${event.toState} by ${actorName}`,
    )
  }
}

@Injectable()
@EventsHandler(BoxUpdatedDomainEvent)
export class BoxUpdatedBroadcastSubscriber implements IEventHandler<BoxUpdatedDomainEvent> {
  constructor(private readonly adminGateway: AdminGateway) {}

  handle(evt: BoxUpdatedDomainEvent): void {
    this.adminGateway.broadcastBoxUpdated({
      boxId: evt.boxId,
      reference: evt.reference,
      status: evt.status,
    })
    this.adminGateway.broadcastDashboardInvalidate('box_change')
  }
}

export const REALTIME_SUBSCRIBERS = [
  ParcelTransitionedBroadcastSubscriber,
  BoxUpdatedBroadcastSubscriber,
]
