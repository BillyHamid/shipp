import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { QrModule } from '../qr/qr.module.js'
import { PricingModule } from '../pricing/pricing.module.js'
import { ParcelsController } from './parcels.controller.js'
import { ParcelStateMachine } from './domain/parcel-state-machine.js'
import { TrackingNumberFactory } from './domain/tracking-number.factory.js'
import { PARCEL_COMMAND_HANDLERS } from './commands/index.js'
import { PARCEL_QUERY_HANDLERS } from './queries/index.js'

@Module({
  imports: [CqrsModule, QrModule, PricingModule],
  controllers: [ParcelsController],
  providers: [
    ParcelStateMachine,
    TrackingNumberFactory,
    ...PARCEL_COMMAND_HANDLERS,
    ...PARCEL_QUERY_HANDLERS,
  ],
  exports: [ParcelStateMachine, TrackingNumberFactory],
})
export class ParcelsModule {}
