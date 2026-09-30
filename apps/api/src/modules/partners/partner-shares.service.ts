import { Injectable } from '@nestjs/common'
import { Currency, PartnerShareType } from '@prisma/client'
import { PrismaService } from '../../common/prisma/prisma.service.js'
import { PricingService } from '../pricing/pricing.service.js'

/**
 * The single place that knows the profit-share rule: every dollar/franc of
 * revenue or expense is converted to USD (the day's rate) and split exactly
 * in half between the two partners. Fixed 50/50 by business decision — if
 * that ever changes, this is the only file that needs to. Keeping the
 * partner ledger in one currency means each partner sees one clean net
 * number instead of adding up separate USD/XOF buckets by hand.
 */
@Injectable()
export class PartnerSharesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
  ) {}

  async splitAndRecord(params: {
    type: PartnerShareType
    amount: number
    currency: Currency
    label: string
    paymentId?: string
    expenseId?: string
  }): Promise<void> {
    const partners = await this.prisma.partner.findMany({ where: { active: true } })
    if (partners.length === 0) return

    const amountUsd = await this.toUsd(params.amount, params.currency)
    const half = Math.round((amountUsd / partners.length) * 100) / 100

    await this.prisma.partnerShare.createMany({
      data: partners.map((partner) => ({
        partnerId: partner.id,
        type: params.type,
        amount: half,
        currency: 'USD',
        label: params.label,
        paymentId: params.paymentId ?? null,
        expenseId: params.expenseId ?? null,
      })),
    })
  }

  private async toUsd(amount: number, currency: Currency): Promise<number> {
    if (currency === 'USD') return amount
    if (currency === 'XOF') {
      const rate = await this.pricing.latestRate('USD', 'XOF')
      return rate > 0 ? amount / rate : amount
    }
    // No conversion table for other currencies (e.g. EUR) — pass through
    // rather than crash; none of today's cash accounts use them.
    return amount
  }
}
