import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../common/prisma/prisma.service.js'
import { ListParcelsQuery } from './list-parcels.query.js'

@QueryHandler(ListParcelsQuery)
export class ListParcelsHandler implements IQueryHandler<ListParcelsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListParcelsQuery) {
    const { params } = query
    const page = params.page ?? 1
    const pageSize = Math.min(params.pageSize ?? 25, 100)

    const where: Prisma.ParcelWhereInput = {
      ...(params.state && { currentState: params.state }),
      ...(params.paymentState && { paymentState: params.paymentState }),
      ...(params.boxId && { boxId: params.boxId }),
      ...((params.dateFrom || params.dateTo) && {
        createdAt: {
          ...(params.dateFrom && { gte: params.dateFrom }),
          ...(params.dateTo && { lte: params.dateTo }),
        },
      }),
      ...(params.query && {
        OR: [
          { trackingNumber: { contains: params.query, mode: 'insensitive' } },
          { sender: { fullName: { contains: params.query, mode: 'insensitive' } } },
          { recipient: { fullName: { contains: params.query, mode: 'insensitive' } } },
        ],
      }),
    }

    const [items, total] = await Promise.all([
      this.prisma.parcel.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          sender: { select: { id: true, fullName: true, phone: true } },
          recipient: { select: { id: true, fullName: true, phone: true } },
          box: { select: { id: true, reference: true, type: true, status: true } },
        },
      }),
      this.prisma.parcel.count({ where }),
    ])

    return { items, total, page, pageSize }
  }
}
