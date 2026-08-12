import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { Box } from '@prisma/client'
import { PrismaService } from '../../common/prisma/prisma.service.js'
import { BoxReferenceFactory } from './box-reference.factory.js'
import { BoxUpdatedDomainEvent } from './events/box-updated.event.js'
import type { CreateBoxDto } from '@gsg/shared-types/schemas'

@Injectable()
export class BoxesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refFactory: BoxReferenceFactory,
    private readonly eventBus: EventBus,
  ) {}

  async create(dto: CreateBoxDto, createdById: string): Promise<Box> {
    const reference = await this.refFactory.generate(dto.type)
    return this.prisma.box.create({
      data: {
        reference,
        type: dto.type,
        capacityKg: dto.capacityKg,
        originCountry: dto.originCountry,
        destCountry: dto.destCountry,
        status: 'open',
        createdById,
      },
    })
  }

  async findById(id: string) {
    const box = await this.prisma.box.findUnique({
      where: { id },
      include: {
        parcels: {
          select: {
            id: true,
            trackingNumber: true,
            currentState: true,
            weightKg: true,
            recipient: { select: { fullName: true } },
          },
        },
      },
    })
    if (!box) throw new NotFoundException(`Box ${id} not found`)
    return box
  }

  async list(params: { status?: string; page?: number; pageSize?: number }) {
    const page = params.page ?? 1
    const pageSize = Math.min(params.pageSize ?? 25, 100)
    const where = { ...(params.status && { status: params.status as never }) }

    const [items, total] = await Promise.all([
      this.prisma.box.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { parcels: true } } },
      }),
      this.prisma.box.count({ where }),
    ])

    return { items, total, page, pageSize }
  }

  /** Dispatch a box: box → shipped, and cascade all contained parcels → shipped. */
  async dispatch(boxId: string): Promise<Box> {
    const box = await this.findById(boxId)
    if (box.status !== 'open') {
      throw new BadRequestException(`Box must be 'open' to dispatch (current: ${box.status})`)
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const b = await tx.box.update({
        where: { id: boxId },
        data: { status: 'shipped', departedAt: new Date() },
      })

      // Cascade eligible parcels (preparing → shipped) — parcels not yet
      // scanned into warehouse are left untouched; that's an operator error
      // to fix manually, not silently overridden here.
      await tx.parcel.updateMany({
        where: { boxId, currentState: 'preparing' },
        data: { currentState: 'shipped' },
      })

      return b
    })

    this.eventBus.publish(new BoxUpdatedDomainEvent(updated.id, updated.reference, updated.status))
    return updated
  }

  /** Box arrives at destination: box → arrived, cascade parcels → arrived_country. */
  async markArrived(boxId: string): Promise<Box> {
    const box = await this.findById(boxId)
    if (box.status !== 'shipped' && box.status !== 'in_transit') {
      throw new BadRequestException(
        `Box must be 'shipped' or 'in_transit' to mark arrived (current: ${box.status})`,
      )
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const b = await tx.box.update({
        where: { id: boxId },
        data: { status: 'arrived', arrivedAt: new Date() },
      })

      await tx.parcel.updateMany({
        where: { boxId, currentState: { in: ['shipped', 'in_transit'] } },
        data: { currentState: 'arrived_country' },
      })

      return b
    })

    this.eventBus.publish(new BoxUpdatedDomainEvent(updated.id, updated.reference, updated.status))
    return updated
  }
}
