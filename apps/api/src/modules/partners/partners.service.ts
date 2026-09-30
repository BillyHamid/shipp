import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../common/prisma/prisma.service.js'

export interface PartnerSummary {
  partnerId: string
  code: string
  label: string
  byCurrency: Record<string, { revenue: number; expense: number; net: number }>
}

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.partner.findMany({ where: { active: true }, orderBy: { code: 'asc' } })
  }

  /** Net position per partner per currency = revenue share − expense share, for an optional period. */
  async summary(params: { dateFrom?: Date; dateTo?: Date }): Promise<PartnerSummary[]> {
    const partners = await this.list()

    const where: Prisma.PartnerShareWhereInput = {
      ...((params.dateFrom || params.dateTo) && {
        createdAt: {
          ...(params.dateFrom && { gte: params.dateFrom }),
          ...(params.dateTo && { lte: params.dateTo }),
        },
      }),
    }

    const shares = await this.prisma.partnerShare.findMany({
      where: { ...where, partnerId: { in: partners.map((p) => p.id) } },
    })

    return partners.map((partner) => {
      const byCurrency: PartnerSummary['byCurrency'] = {}
      for (const share of shares.filter((s) => s.partnerId === partner.id)) {
        const bucket = (byCurrency[share.currency] ??= { revenue: 0, expense: 0, net: 0 })
        const amount = Number(share.amount)
        if (share.type === 'revenue') bucket.revenue += amount
        else bucket.expense += amount
        bucket.net = bucket.revenue - bucket.expense
      }
      return { partnerId: partner.id, code: partner.code, label: partner.label, byCurrency }
    })
  }

  async listShares(params: {
    partnerId?: string
    dateFrom?: Date
    dateTo?: Date
    page?: number
    pageSize?: number
  }) {
    const page = params.page ?? 1
    const pageSize = Math.min(params.pageSize ?? 25, 100)
    const where: Prisma.PartnerShareWhereInput = {
      ...(params.partnerId && { partnerId: params.partnerId }),
      ...((params.dateFrom || params.dateTo) && {
        createdAt: {
          ...(params.dateFrom && { gte: params.dateFrom }),
          ...(params.dateTo && { lte: params.dateTo }),
        },
      }),
    }

    const [items, total] = await Promise.all([
      this.prisma.partnerShare.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { partner: { select: { code: true, label: true } } },
      }),
      this.prisma.partnerShare.count({ where }),
    ])

    return { items, total, page, pageSize }
  }
}
