import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Payment } from '@prisma/client'
import { PrismaService } from '../../common/prisma/prisma.service.js'
import { CashOperationsService } from './cash-operations.service.js'
import type { RecordPaymentDto } from '@gsg/shared-types/schemas'

/**
 * Recording a payment does three things atomically:
 *   1. Creates the Payment row
 *   2. Flips Parcel.paymentState → 'paid'
 *   3. Creates a matching CashOperation (inflow) if a cash account was given
 *
 * This is the one place in the system where "money" and "parcel state"
 * intersect — keeping it centralized avoids the two drifting apart.
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cashOperations: CashOperationsService,
  ) {}

  async record(dto: RecordPaymentDto, recordedById: string): Promise<Payment> {
    const parcel = await this.prisma.parcel.findUnique({ where: { id: dto.parcelId } })
    if (!parcel) throw new NotFoundException(`Parcel ${dto.parcelId} not found`)
    if (parcel.paymentState === 'paid') {
      throw new BadRequestException('Parcel is already marked as paid')
    }

    const amountXof = Math.round(dto.amountUsd * Number(parcel.exchangeRate))

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
        data: { paymentState: 'paid' },
      })

      return p
    })

    if (dto.cashAccountId) {
      await this.cashOperations.create(
        {
          accountId: dto.cashAccountId,
          type: 'inflow',
          label: `Paiement colis ${parcel.trackingNumber}`,
          amount: dto.amountUsd,
          referenceId: payment.id,
        },
        recordedById,
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

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'refunded' },
      })
      await tx.parcel.update({
        where: { id: payment.parcelId },
        data: { paymentState: 'refunded' },
      })
      return p
    })

    if (payment.cashAccountId) {
      await this.cashOperations.create(
        {
          accountId: payment.cashAccountId,
          type: 'outflow',
          label: `Remboursement colis ${payment.parcel.trackingNumber}`,
          amount: Number(payment.amountUsd),
          referenceId: payment.id,
        },
        recordedById,
      )
    }

    return updated
  }
}
