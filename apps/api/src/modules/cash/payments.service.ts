import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { Payment } from '@prisma/client'
import { PrismaService } from '../../common/prisma/prisma.service.js'
import { CashOperationsService } from './cash-operations.service.js'
import { PaymentRecordedDomainEvent } from './events/payment-recorded.event.js'
import { PaymentRefundedDomainEvent } from './events/payment-refunded.event.js'
import type { RecordPaymentDto } from '@gsg/shared-types/schemas'
import type { PaymentState } from '@gsg/shared-types/domain'

const ROUNDING_EPSILON = 0.01

/**
 * Recording a payment does three things atomically:
 *   1. Creates the Payment row (one parcel can have several — partial payments)
 *   2. Sets Parcel.paymentState to 'partial' or 'paid' depending on how much
 *      of the price has now been collected in total
 *   3. Creates a matching CashOperation (inflow) if a cash account was given,
 *      and publishes an event so the partner revenue split reacts to it
 *
 * This is the one place in the system where "money" and "parcel state"
 * intersect — keeping it centralized avoids the two drifting apart.
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cashOperations: CashOperationsService,
    private readonly eventBus: EventBus,
  ) {}

  async record(dto: RecordPaymentDto, recordedById: string): Promise<Payment> {
    const parcel = await this.prisma.parcel.findUnique({ where: { id: dto.parcelId } })
    if (!parcel) throw new NotFoundException(`Parcel ${dto.parcelId} not found`)

    const paidAgg = await this.prisma.payment.aggregate({
      where: { parcelId: dto.parcelId, status: 'paid' },
      _sum: { amountUsd: true },
    })
    const paidSoFar = Number(paidAgg._sum.amountUsd ?? 0)
    const remaining = Number(parcel.priceUsd) - paidSoFar
    if (remaining <= ROUNDING_EPSILON) {
      throw new BadRequestException('Parcel is already fully paid')
    }
    if (dto.amountUsd > remaining + ROUNDING_EPSILON) {
      throw new BadRequestException(`Amount exceeds the remaining balance (${remaining.toFixed(2)} $)`)
    }

    const amountXof = Math.round(dto.amountUsd * Number(parcel.exchangeRate))

    // Resolved up front (not just by id) so we know which currency to
    // credit the account in — CashOperation.amount is booked in the
    // account's own currency, never blindly in USD.
    let cashAccount: { id: string; currency: string } | null = null
    if (dto.cashAccountId) {
      cashAccount = await this.prisma.cashAccount.findUnique({
        where: { id: dto.cashAccountId },
        select: { id: true, currency: true },
      })
      if (!cashAccount) throw new NotFoundException(`Cash account ${dto.cashAccountId} not found`)
      if (cashAccount.currency !== 'USD' && cashAccount.currency !== 'XOF') {
        throw new BadRequestException(
          `Cannot credit a payment to a ${cashAccount.currency} account — no conversion rate available`,
        )
      }
    }

    const newPaymentState: PaymentState =
      paidSoFar + dto.amountUsd >= Number(parcel.priceUsd) - ROUNDING_EPSILON ? 'paid' : 'partial'

    const payment = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          parcelId: dto.parcelId,
          amountUsd: dto.amountUsd,
          amountXof,
          mode: dto.mode,
          status: 'paid',
          paidAt: new Date(),
          cashAccountId: dto.cashAccountId ?? null,
          recordedById,
        },
      })

      await tx.parcel.update({
        where: { id: dto.parcelId },
        data: { paymentState: newPaymentState },
      })

      return p
    })

    if (cashAccount) {
      const creditedAmount = cashAccount.currency === 'XOF' ? amountXof : dto.amountUsd
      await this.cashOperations.create(
        {
          accountId: cashAccount.id,
          type: 'inflow',
          label: `Paiement colis ${parcel.trackingNumber}`,
          amount: creditedAmount,
          referenceId: payment.id,
        },
        recordedById,
      )

      // Revenue split between partners is handled entirely by a listener on
      // this event (see modules/partners) — keeps PaymentsService ignorant
      // of the profit-sharing rule, same as boxes/parcels publish-and-forget.
      this.eventBus.publish(
        new PaymentRecordedDomainEvent(
          payment.id,
          cashAccount.id,
          cashAccount.currency as 'USD' | 'XOF',
          creditedAmount,
          parcel.trackingNumber,
        ),
      )
    }

    return payment
  }

  async refund(paymentId: string, recordedById: string): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { parcel: true },
    })
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`)
    if (payment.status === 'refunded') {
      throw new BadRequestException('Payment already refunded')
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'refunded' },
      })

      // Recompute the parcel's payment state from what's left standing —
      // other partial payments on the same parcel may still be valid.
      const remainingAgg = await tx.payment.aggregate({
        where: { parcelId: payment.parcelId, status: 'paid' },
        _sum: { amountUsd: true },
      })
      const remainingPaid = Number(remainingAgg._sum.amountUsd ?? 0)
      const newState: PaymentState =
        remainingPaid <= ROUNDING_EPSILON
          ? 'pending'
          : remainingPaid >= Number(payment.parcel.priceUsd) - ROUNDING_EPSILON
            ? 'paid'
            : 'partial'
      await tx.parcel.update({ where: { id: payment.parcelId }, data: { paymentState: newState } })

      return p
    })

    if (payment.cashAccountId) {
      const cashAccount = await this.prisma.cashAccount.findUnique({
        where: { id: payment.cashAccountId },
        select: { currency: true },
      })
      const reversedAmount = cashAccount?.currency === 'XOF' ? Number(payment.amountXof) : Number(payment.amountUsd)
      await this.cashOperations.create(
        {
          accountId: payment.cashAccountId,
          type: 'outflow',
          label: `Remboursement colis ${payment.parcel.trackingNumber}`,
          amount: reversedAmount,
          referenceId: payment.id,
        },
        recordedById,
      )

      this.eventBus.publish(
        new PaymentRefundedDomainEvent(
          payment.id,
          payment.cashAccountId,
          (cashAccount?.currency ?? 'USD') as 'USD' | 'XOF',
          reversedAmount,
          payment.parcel.trackingNumber,
        ),
      )
    }

    return updated
  }

  async listForParcel(parcelId: string) {
    return this.prisma.payment.findMany({
      where: { parcelId },
      orderBy: { createdAt: 'desc' },
      include: { cashAccount: { select: { code: true, label: true, currency: true } } },
    })
  }

  /** Auto-refunds every standing payment on a parcel — used when a paid/partial parcel gets cancelled. */
  async refundAllForParcel(parcelId: string, recordedById: string): Promise<void> {
    const payments = await this.prisma.payment.findMany({
      where: { parcelId, status: 'paid' },
      select: { id: true },
    })
    for (const p of payments) {
      await this.refund(p.id, recordedById)
    }
  }
}
