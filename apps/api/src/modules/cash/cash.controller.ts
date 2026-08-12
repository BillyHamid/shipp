import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { z } from 'zod'
import {
  CreateCashOperationDtoSchema,
  RecordPaymentDtoSchema,
  type CreateCashOperationDto,
  type RecordPaymentDto,
} from '@gsg/shared-types/schemas'
import { CURRENCIES, COUNTRIES } from '@gsg/shared-types/domain'
import { PERMISSIONS } from '@gsg/shared-types/permissions'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js'
import { CurrentUser } from '../auth/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../auth/auth.service.js'
import { CashAccountsService } from './cash-accounts.service.js'
import { CashOperationsService } from './cash-operations.service.js'
import { PaymentsService } from './payments.service.js'

const CreateCashAccountDtoSchema = z.object({
  code: z.string().min(3).max(30),
  label: z.string().min(2).max(120),
  country: z.enum(COUNTRIES),
  currency: z.enum(CURRENCIES),
})
type CreateCashAccountDto = z.infer<typeof CreateCashAccountDtoSchema>

@Controller('cash')
export class CashController {
  constructor(
    private readonly accounts: CashAccountsService,
    private readonly operations: CashOperationsService,
    private readonly payments: PaymentsService,
  ) {}

  @Get('accounts')
  @RequirePermissions(PERMISSIONS.CASH_READ)
  listAccounts() {
    return this.accounts.list()
  }

  @Get('accounts/:id')
  @RequirePermissions(PERMISSIONS.CASH_READ)
  getAccount(@Param('id') id: string) {
    return this.accounts.findById(id)
  }

  @Post('accounts')
  @RequirePermissions(PERMISSIONS.CASH_OPERATE)
  createAccount(
    @Body(new ZodValidationPipe(CreateCashAccountDtoSchema)) dto: CreateCashAccountDto,
  ) {
    return this.accounts.create(dto)
  }

  @Get('operations')
  @RequirePermissions(PERMISSIONS.CASH_READ)
  listOperations(
    @Query('accountId') accountId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.operations.list({
      accountId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    })
  }

  @Post('operations')
  @RequirePermissions(PERMISSIONS.CASH_OPERATE)
  createOperation(
    @Body(new ZodValidationPipe(CreateCashOperationDtoSchema)) dto: CreateCashOperationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.operations.create(dto, user.id)
  }

  @Post('payments')
  @RequirePermissions(PERMISSIONS.CASH_OPERATE)
  recordPayment(
    @Body(new ZodValidationPipe(RecordPaymentDtoSchema)) dto: RecordPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.payments.record(dto, user.id)
  }

  @Post('payments/:id/refund')
  @RequirePermissions(PERMISSIONS.CASH_OPERATE)
  refundPayment(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.payments.refund(id, user.id)
  }
}
