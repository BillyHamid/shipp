import { Controller, Get, Param } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { Public } from '../auth/decorators/public.decorator.js'
import { PublicTrackingService } from './public-tracking.service.js'

@Controller('public/track')
export class PublicTrackingController {
  constructor(private readonly tracking: PublicTrackingService) {}

  @Public()
  @Get(':trackingNumber')
  // Stricter than the global 100/min default — this endpoint is unauthenticated
  // and a juicy target for tracking-number enumeration.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  track(@Param('trackingNumber') trackingNumber: string) {
    return this.tracking.track(trackingNumber.toUpperCase())
  }
}
