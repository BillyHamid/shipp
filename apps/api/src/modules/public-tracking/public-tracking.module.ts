import { Module } from '@nestjs/common'
import { PublicTrackingController } from './public-tracking.controller.js'
import { PublicTrackingService } from './public-tracking.service.js'

@Module({
  controllers: [PublicTrackingController],
  providers: [PublicTrackingService],
})
export class PublicTrackingModule {}
