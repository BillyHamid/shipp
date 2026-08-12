import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { CashOperation, CashOpType, Prisma } from '@prisma/client'
import { PrismaService } from '../../common/prisma/prisma.service.js'
import type { CreateCashOperationDto } from '@gsg/shared-types/schemas'

export interface ListOperationsParams {
  accountId?: string
  dateFrom?: Date
  dateTo?: Date
  page?: number
  pageSize?: number
}

/**
 * Every write here is a balance-affecting transaction: we snapshot
 * balanceBefore/balanceAfter on the operation row (immutable ledger entry)
 * AND update the live CashAccount.balance in the same DB transaction, so
 * the two can never drift out of sync.
 */
@Injectable()
export class CashOperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCashOperationDto, createdById: string): Promise<CashOperation> {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.cashAccount.findUnique({ where: { id: dto.accountId } })
      if (!account) throw new NotFoundException(`Cash account ${dto.accountId} not found`)
      if (!account.active) throw new BadRequestException('Cash account is inactive')

      const balanceBefore = account.balance
      const delta = dto.type === 'outflow' ? -dto.amount : dto.amount
      const balanceAfter = new Prisma.Decimal(balanceBefore).plus(delta)

      if (dto.type === 'outflow' && balanceAfter.isNegative()) {
        throw new BadRequestException('Insufficient balance for this outflow')
      }

      await tx.cashAccount.update({
        where: { id: account.id },
        data: { balance: balanceAfter },
      })

      return tx.cashOperation.create({
        data: {
          accountId: account.id,
          type: dto.type as CashOpType,
          label: dto.label,
          amount: dto.amount,
          balanceBefore,
          balanceAfter,
          referenceId: dto.referenceId ?? null,
          createdById,
        },
      })
    })
  }

  async list(params: ListOperationsParams) {
    const page = params.page ?? 1
    const pageSize = Math.min(params.pageSize ?? 25, 100)
    const where: Prisma.CashOperationWhereInput = {
      ...(params.accountId && { accountId: params.accountId }),
      ...((params.dateFrom || params.dateTo) && {
        createdAt: {
          ...(params.dateFrom && { gte: params.dateFrom }),
          ...(params.dateTo && { lte: params.dateTo }),
        },
      }),
    }

    const [items, total] = await Promise.all([
      this.prisma.cashOperation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { account: { select: { code: true, label: true, currency: true } } },
      }),
      this.prisma.cashOperation.count({ where }),
    ])

    return { items, total, page, pageSize }
  }
}
