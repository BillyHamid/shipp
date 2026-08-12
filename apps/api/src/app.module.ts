import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { CqrsModule } from '@nestjs/cqrs'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { LoggerModule } from 'nestjs-pino'

import { AppConfigModule } from './common/config/app-config.module.js'
import { PrismaModule } from './common/prisma/prisma.module.js'
import { HealthModule } from './health/health.module.js'
import { AuthModule } from './modules/auth/auth.module.js'
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard.js'
import { PermissionGuard } from './modules/auth/guards/permission.guard.js'
import { CustomersModule } from './modules/customers/customers.module.js'
import { BoxesModule } from './modules/boxes/boxes.module.js'
import { QrModule } from './modules/qr/qr.module.js'
import { PricingModule } from './modules/pricing/pricing.module.js'
import { ParcelsModule } from './modules/parcels/parcels.module.js'
import { ScanModule } from './modules/scan/scan.module.js'
import { PublicTrackingModule } from './modules/public-tracking/public-tracking.module.js'
import { CashModule } from './modules/cash/cash.module.js'
import { RealtimeModule } from './modules/realtime/realtime.module.js'
import { NotificationsModule } from './modules/notifications/notifications.module.js'
import { DashboardModule } from './modules/dashboard/dashboard.module.js'
import { UsersModule } from './modules/users/users.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true, colorize: true } },
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    CqrsModule.forRoot(),
    AppConfigModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    CustomersModule,
    BoxesModule,
    QrModule,
    PricingModule,
    ParcelsModule,
    ScanModule,
    PublicTrackingModule,
    CashModule,
    RealtimeModule,
    NotificationsModule,
    DashboardModule,
    UsersModule,
  ],
  providers: [
    // Order matters: throttle first, then auth, then permissions.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
})
export class AppModule {}
