import { Module } from '@nestjs/common'
import { CashController } from './cash.controller.js'
import { CashAccountsService } from './cash-accounts.service.js'
import { CashOperationsService } from './cash-operations.service.js'
import { PaymentsService } from './payments.service.js'

@Module({
  controllers: [CashController],
  providers: [CashAccountsService, CashOperationsService, PaymentsService],
  exports: [CashAccountsService, CashOperationsService, PaymentsService],
})
export class CashModule {}
