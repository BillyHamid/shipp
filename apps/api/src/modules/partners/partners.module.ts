import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { CashModule } from '../cash/cash.module.js'
import { PricingModule } from '../pricing/pricing.module.js'
import { PartnersController } from './partners.controller.js'
import { PartnersService } from './partners.service.js'
import { ExpensesService } from './expenses.service.js'
import { PartnerSharesService } from './partner-shares.service.js'
import { PaymentRecordedListener } from './payment-recorded.listener.js'
import { PaymentRefundedListener } from './payment-refunded.listener.js'

@Module({
  imports: [CqrsModule, CashModule, PricingModule],
  controllers: [PartnersController],
  providers: [
    PartnersService,
    ExpensesService,
    PartnerSharesService,
    PaymentRecordedListener,
    PaymentRefundedListener,
  ],
  exports: [PartnersService, ExpensesService],
})
export class PartnersModule {}
