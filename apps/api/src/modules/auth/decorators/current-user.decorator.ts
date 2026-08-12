import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { AuthenticatedUser } from '../auth.service.js'

/**
 * Inject the authenticated user into a controller method.
 *
 * @example
 *   @Get('me')
 *   me(@CurrentUser() user: AuthenticatedUser) { return user }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const req = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>()
    return req.user
  },
)
