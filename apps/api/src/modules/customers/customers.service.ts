import { Injectable, NotFoundException } from '@nestjs/common'
import { Customer } from '@prisma/client'
import { PrismaService } from '../../common/prisma/prisma.service.js'
import type { CreateCustomerDto } from '@gsg/shared-types/schemas'

export interface ListCustomersParams {
  query?: string
  country?: string
  page?: number
  pageSize?: number
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    return this.prisma.customer.create({
      data: {
        fullName: dto.fullName.trim(),
        phone: dto.phone.trim(),
        email: dto.email ?? null,
        country: dto.country,
        address: dto.address ?? null,
      },
    })
  }

  async findById(id: string): Promise<Customer> {
    const customer = await this.prisma.customer.findUnique({ where: { id } })
    if (!customer) throw new NotFoundException(`Customer ${id} not found`)
    return customer
  }

  async update(id: string, dto: Partial<CreateCustomerDto>): Promise<Customer> {
    await this.findById(id)
    return this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName.trim() }),
        ...(dto.phone !== undefined && { phone: dto.phone.trim() }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.address !== undefined && { address: dto.address }),
      },
    })
  }

  async list(params: ListCustomersParams): Promise<Paginated<Customer>> {
    const page = params.page ?? 1
    const pageSize = Math.min(params.pageSize ?? 25, 100)

    const where = {
      ...(params.country && { country: params.country }),
      ...(params.query && {
        OR: [
          { fullName: { contains: params.query, mode: 'insensitive' as const } },
          { phone: { contains: params.query, mode: 'insensitive' as const } },
          { email: { contains: params.query, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.customer.count({ where }),
    ])

    return { items, total, page, pageSize }
  }

  /** Used by parcel creation: find existing customer by phone or create a new one. */
  async findOrCreateByPhone(dto: CreateCustomerDto): Promise<Customer> {
    const existing = await this.prisma.customer.findFirst({
      where: { phone: dto.phone.trim(), country: dto.country },
    })
    if (existing) return existing
    return this.create(dto)
  }

  async historyByCustomer(customerId: string) {
    await this.findById(customerId)
    const parcels = await this.prisma.parcel.findMany({
      where: { recipientId: customerId },
      select: {
        id: true,
        trackingNumber: true,
        priceUsd: true,
        priceXof: true,
        originCountry: true,
        destCountry: true,
        currentState: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalUsd = parcels.reduce((sum, p) => sum + Number(p.priceUsd), 0)
    const totalXof = parcels.reduce((sum, p) => sum + Number(p.priceXof), 0)

    return {
      customerId,
      parcelCount: parcels.length,
      totalUsd,
      totalXof,
      parcels,
    }
  }
}
