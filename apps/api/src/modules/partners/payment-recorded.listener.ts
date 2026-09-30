import { Injectable } from '@nestjs/common'
import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { PaymentRecordedDomainEvent } from '../cash/events/payment-recorded.event.js'
import { PartnerSharesService } from './partner-shares.service.js'

/**
 * Reacts to every credited payment by splitting the revenue 50/50 between
 * the partners. Lives here (not in the cash module) so PaymentsService stays
 * ignorant of the profit-sharing rule — it only publishes a fact.
 */
@Injectable()
@EventsHandler(PaymentRecordedDomainEvent)
export class PaymentRecordedListener implements IEventHandler<PaymentRecordedDomainEvent> {
  constructor(private readonly partnerShares: PartnerSharesService) {}

  async handle(evt: PaymentRecordedDomainEvent): Promise<void> {
    await this.partnerShares.splitAndRecord({
      type: 'revenue',
      amount: evt.amount,
      currency: evt.currency,
      label: `Paiement colis ${evt.trackingNumber}`,
      paymentId: evt.paymentId,
    })
  }
}
