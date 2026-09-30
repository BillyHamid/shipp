import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { CashController } from './cash.controller.js'
import { CashAccountsService } from './cash-accounts.service.js'
import { CashOperationsService } from './cash-operations.service.js'
import { PaymentsService } from './payments.service.js'
import { ParcelCancelledRefundListener } from './parcel-cancelled.listener.js'

@Module({
  imports: [CqrsModule],
  controllers: [CashController],
  providers: [CashAccountsService, CashOperationsService, PaymentsService, ParcelCancelledRefundListener],
  exports: [CashAccountsService, CashOperationsService, PaymentsService],
})
export class CashModule {}
