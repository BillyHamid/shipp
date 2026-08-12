import { Injectable } from '@nestjs/common'
import { PARCEL_STATES, type ParcelState } from '@gsg/shared-types/domain'
import { PrismaService } from '../../common/prisma/prisma.service.js'

export interface DashboardKpis {
  byState: Record<ParcelState, number>
  totalParcels: number
  boxExpressCount: number
  boxCargoCount: number
}

export interface DashboardChart {
  categories: string[]
  series: { name: string; data: number[] }[]
}

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async kpis(): Promise<DashboardKpis> {
    const [counts, totalParcels, boxExpressCount, boxCargoCount] = await Promise.all([
      this.prisma.parcel.groupBy({ by: ['currentState'], _count: { _all: true } }),
      this.prisma.parcel.count(),
      this.prisma.box.count({ where: { type: 'EXPRESS' } }),
      this.prisma.box.count({ where: { type: 'CARGO' } }),
    ])

    const byState = Object.fromEntries(PARCEL_STATES.map((s) => [s, 0])) as Record<ParcelState, number>
    for (const row of counts) byState[row.currentState] = row._count._all

    return { byState, totalParcels, boxExpressCount, boxCargoCount }
  }

  /** Monthly parcel creation count for a given year, split by current state (stacked bar-friendly). */
  async chart(year: number): Promise<DashboardChart> {
    const start = new Date(Date.UTC(year, 0, 1))
    const end = new Date(Date.UTC(year + 1, 0, 1))

    const parcels = await this.prisma.parcel.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { createdAt: true, currentState: true },
    })

    const trackedStates: ParcelState[] = ['registered', 'in_transit', 'delivered', 'cancelled']
    const series = trackedStates.map((state) => ({
      name: state,
      data: Array(12).fill(0) as number[],
    }))

    for (const p of parcels) {
      const month = p.createdAt.getUTCMonth()
      const seriesIdx = trackedStates.indexOf(p.currentState)
      if (seriesIdx >= 0) series[seriesIdx]!.data[month]! += 1
    }

    return { categories: MONTHS_FR, series }
  }
}
