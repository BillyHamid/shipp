import { Injectable } from '@nestjs/common'
import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { PaymentRefundedDomainEvent } from '../cash/events/payment-refunded.event.js'
import { PartnerSharesService } from './partner-shares.service.js'

/**
 * Mirrors PaymentRecordedListener: a refund reverses the revenue share that
 * was credited when the payment was originally recorded. Recorded as a
 * negative 'revenue' entry (not a new type) so it nets straight out of each
 * partner's revenue total in the summary — no special-casing needed there.
 */
@Injectable()
@EventsHandler(PaymentRefundedDomainEvent)
export class PaymentRefundedListener implements IEventHandler<PaymentRefundedDomainEvent> {
  constructor(private readonly partnerShares: PartnerSharesService) {}

  async handle(evt: PaymentRefundedDomainEvent): Promise<void> {
    await this.partnerShares.splitAndRecord({
      type: 'revenue',
      amount: -evt.amount,
      currency: evt.currency,
      label: `Remboursement colis ${evt.trackingNumber}`,
      paymentId: evt.paymentId,
    })
  }
}
