import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { Socket } from 'socket.io'

/**
 * Validates the JWT passed in the Socket.IO handshake (`auth: { token }`),
 * used to gate admin-only WS subscriptions (e.g. watching a specific
 * parcel's live feed from the admin UI).
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>()
    const token = client.handshake.auth?.token as string | undefined
    if (!token) throw new UnauthorizedException('Missing WS auth token')

    try {
      this.jwt.verify(token)
      return true
    } catch {
      throw new UnauthorizedException('Invalid WS auth token')
    }
  }
}
