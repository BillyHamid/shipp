import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { JwtModule } from '@nestjs/jwt'
import { AppConfigService } from '../../common/config/app-config.service.js'
import { AdminGateway } from './admin.gateway.js'
import { TrackGateway } from './track.gateway.js'
import { WsJwtGuard } from './ws-jwt.guard.js'
import { REALTIME_SUBSCRIBERS } from './subscribers/broadcast.subscriber.js'

@Module({
  imports: [
    CqrsModule,
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({ secret: config.jwt.accessSecret }),
    }),
  ],
  providers: [AdminGateway, TrackGateway, WsJwtGuard, ...REALTIME_SUBSCRIBERS],
  exports: [AdminGateway, TrackGateway],
})
export class RealtimeModule {}
