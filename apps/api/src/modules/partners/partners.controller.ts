import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { CreateExpenseDtoSchema, type CreateExpenseDto } from '@gsg/shared-types/schemas'
import { PERMISSIONS } from '@gsg/shared-types/permissions'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js'
import { CurrentUser } from '../auth/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../auth/auth.service.js'
import { PartnersService } from './partners.service.js'
import { ExpensesService } from './expenses.service.js'

@Controller()
export class PartnersController {
  constructor(
    private readonly partners: PartnersService,
    private readonly expenses: ExpensesService,
  ) {}

  @Get('partners')
  @RequirePermissions(PERMISSIONS.CASH_READ)
  list() {
    return this.partners.list()
  }

  @Get('partners/summary')
  @RequirePermissions(PERMISSIONS.CASH_READ)
  summary(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.partners.summary({
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    })
  }

  @Get('partners/shares')
  @RequirePermissions(PERMISSIONS.CASH_READ)
  shares(
    @Query('partnerId') partnerId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.partners.listShares({
      partnerId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    })
  }

  @Get('expenses')
  @RequirePermissions(PERMISSIONS.CASH_READ)
  listExpenses(
    @Query('cashAccountId') cashAccountId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.expenses.list({
      cashAccountId,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    })
  }

  @Post('expenses')
  @RequirePermissions(PERMISSIONS.CASH_OPERATE)
  createExpense(
    @Body(new ZodValidationPipe(CreateExpenseDtoSchema)) dto: CreateExpenseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.expenses.create(dto, user.id)
  }
}
