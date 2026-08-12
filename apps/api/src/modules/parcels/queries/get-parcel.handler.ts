import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../common/prisma/prisma.service.js'
import { GetParcelEventsQuery, GetParcelQuery } from './get-parcel.query.js'

@QueryHandler(GetParcelQuery)
export class GetParcelHandler implements IQueryHandler<GetParcelQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetParcelQuery) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: query.parcelId },
      include: {
        sender: true,
        recipient: true,
        box: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!parcel) throw new NotFoundException(`Parcel ${query.parcelId} not found`)
    return parcel
  }
}

@QueryHandler(GetParcelEventsQuery)
export class GetParcelEventsHandler implements IQueryHandler<GetParcelEventsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetParcelEventsQuery) {
    return this.prisma.parcelEvent.findMany({
      where: { parcelId: query.parcelId },
      orderBy: { occurredAt: 'asc' },
      include: { actor: { select: { id: true, fullName: true, role: { select: { name: true } } } } },
    })
  }
}
