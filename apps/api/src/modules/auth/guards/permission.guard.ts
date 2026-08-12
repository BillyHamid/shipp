import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { hasPermission } from '@gsg/shared-types/permissions'
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator.js'
import type { AuthenticatedUser } from '../auth.service.js'

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required || required.length === 0) return true

    const req = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>()
    const user = req.user
    if (!user) throw new ForbiddenException('Not authenticated')

    const ok = required.every((perm) => hasPermission(user.permissions, perm))
    if (!ok) throw new ForbiddenException('Insufficient permissions')

    return true
  }
}
