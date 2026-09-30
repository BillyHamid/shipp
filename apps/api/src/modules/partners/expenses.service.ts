import { Injectable, NotFoundException } from '@nestjs/common'
import { Expense } from '@prisma/client'
import { PrismaService } from '../../common/prisma/prisma.service.js'
import { CashOperationsService } from '../cash/cash-operations.service.js'
import { PartnerSharesService } from './partner-shares.service.js'
import type { CreateExpenseDto } from '@gsg/shared-types/schemas'

/**
 * Posting an expense does three things:
 *   1. Debits the real cash account (CashOperation outflow) — money actually left.
 *   2. Records the Expense row, linked to that operation.
 *   3. Splits it 50/50 between the partners (PartnerShare, type 'expense').
 */
@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cashOperations: CashOperationsService,
    private readonly partnerShares: PartnerSharesService,
  ) {}

  async create(dto: CreateExpenseDto, postedById: string): Promise<Expense> {
    const account = await this.prisma.cashAccount.findUnique({ where: { id: dto.cashAccountId } })
    if (!account) throw new NotFoundException(`Cash account ${dto.cashAccountId} not found`)

    // The account's own currency is the only source of truth for how this
    // amount is booked — a caller-supplied currency could silently mismatch
    // the account (the exact bug once seen in payment crediting).
    const currency = account.currency

    const operation = await this.cashOperations.create(
      {
        accountId: dto.cashAccountId,
        type: 'outflow',
        label: dto.label,
        amount: dto.amount,
      },
      postedById,
    )

    const expense = await this.prisma.expense.create({
      data: {
        label: dto.label,
        amount: dto.amount,
        currency,
        cashAccountId: dto.cashAccountId,
        cashOperationId: operation.id,
        postedById,
      },
    })

    // Operation is created before the expense (expense.cashOperationId is
    // required), so the back-reference is patched in once the expense exists.
    await this.prisma.cashOperation.update({
      where: { id: operation.id },
      data: { referenceId: expense.id },
    })

    await this.partnerShares.splitAndRecord({
      type: 'expense',
      amount: dto.amount,
      currency,
      label: dto.label,
      expenseId: expense.id,
    })

    return expense
  }

  async list(params: { cashAccountId?: string; page?: number; pageSize?: number }) {
    const page = params.page ?? 1
    const pageSize = Math.min(params.pageSize ?? 25, 100)
    const where = { ...(params.cashAccountId && { cashAccountId: params.cashAccountId }) }

    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          cashAccount: { select: { code: true, label: true, currency: true } },
          postedBy: { select: { fullName: true } },
        },
      }),
      this.prisma.expense.count({ where }),
    ])

    return { items, total, page, pageSize }
  }
}
