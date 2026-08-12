import { Injectable, NotFoundException } from '@nestjs/common'
import { CashAccount, Currency } from '@prisma/client'
import { PrismaService } from '../../common/prisma/prisma.service.js'

@Injectable()
export class CashAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<CashAccount[]> {
    return this.prisma.cashAccount.findMany({ orderBy: { code: 'asc' } })
  }

  async findById(id: string): Promise<CashAccount> {
    const account = await this.prisma.cashAccount.findUnique({ where: { id } })
    if (!account) throw new NotFoundException(`Cash account ${id} not found`)
    return account
  }

  async create(data: {
    code: string
    label: string
    country: string
    currency: Currency
  }): Promise<CashAccount> {
    return this.prisma.cashAccount.create({ data: { ...data, balance: 0 } })
  }
}
