import { Injectable, Logger } from '@nestjs/common'
import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { ParcelTransitionedDomainEvent } from '../parcels/events/parcel-transitioned.event.js'
import { PaymentsService } from './payments.service.js'

/**
 * Cancelling a parcel that already has money against it (partial or fully
 * paid) must reverse that money — both the cash account and the partner
 * revenue split — automatically. Without this, a cancelled-but-paid parcel
 * would silently leave stale cash/partner entries behind.
 */
@Injectable()
@EventsHandler(ParcelTransitionedDomainEvent)
export class ParcelCancelledRefundListener implements IEventHandler<ParcelTransitionedDomainEvent> {
  private readonly logger = new Logger(ParcelCancelledRefundListener.name)

  constructor(private readonly payments: PaymentsService) {}

  async handle(evt: ParcelTransitionedDomainEvent): Promise<void> {
    if (evt.event.toState !== 'cancelled') return

    await this.payments.refundAllForParcel(evt.parcel.id, evt.event.actorId)
    this.logger.debug(`Auto-refunded payments for cancelled parcel ${evt.parcel.trackingNumber}`)
  }
}
