import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AppConfigService } from '../../common/config/app-config.service.js'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { PasswordService } from './password.service.js'
import { JwtAccessStrategy } from './strategies/jwt-access.strategy.js'
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'
import { PermissionGuard } from './guards/permission.guard.js'

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwt.accessSecret,
        signOptions: { expiresIn: config.jwt.accessTtl },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    JwtAccessStrategy,
    JwtAuthGuard,
    PermissionGuard,
  ],
  exports: [AuthService, PasswordService, JwtAuthGuard, PermissionGuard],
})
export class AuthModule {}
