import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as crypto from 'node:crypto'
import { PrismaService } from '../../common/prisma/prisma.service.js'
import { AppConfigService } from '../../common/config/app-config.service.js'
import { PasswordService } from './password.service.js'

export interface AuthenticatedUser {
  id: string
  email: string
  fullName: string
  role: string
  permissions: string[]
  country: string | null
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

interface AccessTokenPayload {
  sub: string
  email: string
  role: string
  permissions: string[]
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
    private readonly passwords: PasswordService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────

  async validateCredentials(email: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: true },
    })
    if (!user || !user.active) throw new UnauthorizedException('Invalid credentials')

    const ok = await this.passwords.verify(user.passwordHash, password)
    if (!ok) throw new UnauthorizedException('Invalid credentials')

    // Rotate hash if argon2 parameters have changed
    if (this.passwords.needsRehash(user.passwordHash)) {
      const newHash = await this.passwords.hash(password)
      await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } })
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return this.toAuthenticated(user)
  }

  async issueTokens(
    user: AuthenticatedUser,
    context: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    } satisfies AccessTokenPayload)

    const refreshTokenRaw = crypto.randomBytes(64).toString('base64url')
    const tokenHash = this.hashToken(refreshTokenRaw)
    const expiresAt = new Date(Date.now() + this.parseTtl(this.config.jwt.refreshTtl))

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
      },
    })

    return { accessToken, refreshToken: refreshTokenRaw }
  }

  async refresh(
    refreshTokenRaw: string,
    context: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<TokenPair> {
    const tokenHash = this.hashToken(refreshTokenRaw)
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { role: true } } },
    })

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }
    if (!stored.user.active) throw new UnauthorizedException('User disabled')

    // Rotate: revoke the old one, mint a new pair
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    })

    return this.issueTokens(this.toAuthenticated(stored.user), context)
  }

  async revokeRefreshToken(refreshTokenRaw: string): Promise<void> {
    const tokenHash = this.hashToken(refreshTokenRaw)
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  // ─────────────────────────────────────────────────────────────────────────

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex')
  }

  private parseTtl(ttl: string): number {
    // Accept "15m", "7d", "1h", "30s"
    const m = /^(\d+)([smhd])$/.exec(ttl)
    if (!m) throw new Error(`Invalid TTL: ${ttl}`)
    const n = Number(m[1])
    const unit = m[2]
    return unit === 's' ? n * 1000
         : unit === 'm' ? n * 60_000
         : unit === 'h' ? n * 3_600_000
         : n * 86_400_000
  }

  private toAuthenticated(user: {
    id: string
    email: string
    fullName: string
    country: string | null
    role: { name: string; permissions: unknown }
  }): AuthenticatedUser {
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
