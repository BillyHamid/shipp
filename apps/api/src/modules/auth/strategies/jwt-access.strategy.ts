import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AppConfigService } from '../../../common/config/app-config.service.js'
import { PrismaService } from '../../../common/prisma/prisma.service.js'
import type { AuthenticatedUser } from '../auth.service.js'

interface JwtPayload {
  sub: string
  email: string
  role: string
  permissions: string[]
  iat: number
  exp: number
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    config: AppConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwt.accessSecret,
    })
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Re-fetch user to ensure they're still active and pull fresh permissions.
    // Trade-off: one DB query per protected request. Acceptable for an ERP.
    // For higher throughput, cache user in Redis with short TTL.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    })
    if (!user || !user.active) throw new UnauthorizedException('User not found or disabled')

    const permissions = Array.isArray(user.role.permissions)
      ? (user.role.permissions as string[])
      : []

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
      permissions,
      country: user.country,
    }
  }
}
