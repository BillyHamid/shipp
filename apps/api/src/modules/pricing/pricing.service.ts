import { Injectable, NotFoundException } from '@nestjs/common'
import { Currency, PricingRule } from '@prisma/client'
import { PrismaService } from '../../common/prisma/prisma.service.js'
import { AppConfigService } from '../../common/config/app-config.service.js'
import type { QuotePriceDto } from '@gsg/shared-types/schemas'

export interface PriceQuote {
  priceUsd: number
  priceXof: number
  exchangeRate: number
  ruleId: string | null
}

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Computes a price quote for a parcel: base fee + per-kg rate from the
   * active PricingRule matching (category, origin, dest), converted to XOF
   * using the latest exchange rate. Falls back to a generic default if no
   * rule matches, so parcel creation never hard-fails on missing config.
   */
  async quote(input: QuotePriceDto): Promise<PriceQuote> {
    const rule = await this.findActiveRule(input.category, input.originCountry, input.destCountry)
    const rate = await this.latestRate('USD', 'XOF')

    const base = rule ? Number(rule.basePriceUsd) : 15
    const perKg = rule ? Number(rule.perKgUsd) : 12
    const priceUsd = Math.round((base + perKg * input.weightKg) * 100) / 100
    const priceXof = Math.round(priceUsd * rate)

    return { priceUsd, priceXof, exchangeRate: rate, ruleId: rule?.id ?? null }
  }

  async findActiveRule(
    category: string,
    originCountry: string,
    destCountry: string,
  ): Promise<PricingRule | null> {
    return this.prisma.pricingRule.findFirst({
      where: {
        category,
        originCountry,
        destCountry,
        active: true,
        validFrom: { lte: new Date() },
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
      orderBy: { validFrom: 'desc' },
    })
  }

  async latestRate(from: Currency, to: Currency): Promise<number> {
    const rate = await this.prisma.exchangeRate.findFirst({
      where: { fromCurrency: from, toCurrency: to, validFrom: { lte: new Date() } },
      orderBy: { validFrom: 'desc' },
    })
    return rate ? Number(rate.rate) : this.config.defaultExchangeRateUsdToXof
  }

  async list(): Promise<PricingRule[]> {
    return this.prisma.pricingRule.findMany({ orderBy: [{ category: 'asc' }, { createdAt: 'desc' }] })
  }

  async findById(id: string): Promise<PricingRule> {
    const rule = await this.prisma.pricingRule.findUnique({ where: { id } })
    if (!rule) throw new NotFoundException(`Pricing rule ${id} not found`)
    return rule
  }

  async create(data: {
    label: string
    category: string
    originCountry: string
    destCountry: string
    basePriceUsd: number
    perKgUsd: number
  }): Promise<PricingRule> {
    return this.prisma.pricingRule.create({ data })
  }

  async deactivate(id: string): Promise<PricingRule> {
    await this.findById(id)
    return this.prisma.pricingRule.update({ where: { id }, data: { active: false } })
  }
}
