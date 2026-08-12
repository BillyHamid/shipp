import { SetMetadata } from '@nestjs/common'

export const PERMISSIONS_KEY = 'permissions'

/**
 * Declare which permissions are required to access a route.
 * Combined with PermissionGuard, it enforces RBAC server-side.
 *
 * @example
 *   @RequirePermissions(PERMISSIONS.PARCELS_CREATE)
 *   create() { ... }
 */
export const RequirePermissions = (...permissions: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions)
