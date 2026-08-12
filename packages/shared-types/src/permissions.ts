/**
 * Permission constants and role → permissions mapping.
 * The API checks these server-side on every protected route.
 */

import type { Role } from './domain.js'

export const PERMISSIONS = {
  // Parcels
  PARCELS_READ: 'parcels.read',
  PARCELS_CREATE: 'parcels.create',
  PARCELS_UPDATE: 'parcels.update',
  PARCELS_CANCEL: 'parcels.cancel',
  PARCELS_TRANSITION_SCAN_IN_WAREHOUSE: 'parcels.transition.scan_in_warehouse',
  PARCELS_TRANSITION_ASSIGN_TO_BOX: 'parcels.transition.assign_to_box',
  PARCELS_TRANSITION_BOX_DEPARTED: 'parcels.transition.box_departed',
  PARCELS_TRANSITION_IN_FLIGHT: 'parcels.transition.in_flight',
  PARCELS_TRANSITION_BOX_ARRIVED: 'parcels.transition.box_arrived',
  PARCELS_TRANSITION_DECLARE_CUSTOMS: 'parcels.transition.declare_customs',
  PARCELS_TRANSITION_CUSTOMS_CLEARED: 'parcels.transition.customs_cleared',
  PARCELS_TRANSITION_DELIVER: 'parcels.transition.deliver',

  // Boxes
  BOXES_READ: 'boxes.read',
  BOXES_MANAGE: 'boxes.manage',

  // Cash
  CASH_READ: 'cash.read',
  CASH_OPERATE: 'cash.operate',

  // Pricing
  PRICING_READ: 'pricing.read',
  PRICING_MANAGE: 'pricing.manage',

  // Users & roles
  USERS_READ: 'users.read',
  USERS_MANAGE: 'users.manage',

  // Customers
  CUSTOMERS_READ: 'customers.read',
  CUSTOMERS_MANAGE: 'customers.manage',

  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/** Wildcard means: everything */
export const WILDCARD_PERMISSION = '*' as const

export const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  super_admin: [WILDCARD_PERMISSION],

  admin_global: [
    PERMISSIONS.PARCELS_READ,
    PERMISSIONS.PARCELS_CREATE,
    PERMISSIONS.PARCELS_UPDATE,
    PERMISSIONS.PARCELS_CANCEL,
    PERMISSIONS.PARCELS_TRANSITION_SCAN_IN_WAREHOUSE,
    PERMISSIONS.PARCELS_TRANSITION_ASSIGN_TO_BOX,
    PERMISSIONS.PARCELS_TRANSITION_BOX_DEPARTED,
    PERMISSIONS.PARCELS_TRANSITION_IN_FLIGHT,
    PERMISSIONS.PARCELS_TRANSITION_BOX_ARRIVED,
    PERMISSIONS.PARCELS_TRANSITION_DECLARE_CUSTOMS,
    PERMISSIONS.PARCELS_TRANSITION_CUSTOMS_CLEARED,
    PERMISSIONS.PARCELS_TRANSITION_DELIVER,
    PERMISSIONS.BOXES_READ,
    PERMISSIONS.BOXES_MANAGE,
    PERMISSIONS.CASH_READ,
    PERMISSIONS.CASH_OPERATE,
    PERMISSIONS.PRICING_READ,
    PERMISSIONS.PRICING_MANAGE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_MANAGE,
    PERMISSIONS.DASHBOARD_VIEW,
  ],

  agent_usa: [
    PERMISSIONS.PARCELS_READ,
    PERMISSIONS.PARCELS_CREATE,
    PERMISSIONS.PARCELS_TRANSITION_SCAN_IN_WAREHOUSE,
    PERMISSIONS.PARCELS_TRANSITION_ASSIGN_TO_BOX,
    PERMISSIONS.PARCELS_TRANSITION_BOX_DEPARTED,
    PERMISSIONS.BOXES_READ,
    PERMISSIONS.BOXES_MANAGE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_MANAGE,
    PERMISSIONS.PRICING_READ,
    PERMISSIONS.DASHBOARD_VIEW,
  ],

  agent_bf: [
    PERMISSIONS.PARCELS_READ,
    PERMISSIONS.PARCELS_TRANSITION_BOX_ARRIVED,
    PERMISSIONS.PARCELS_TRANSITION_DECLARE_CUSTOMS,
    PERMISSIONS.PARCELS_TRANSITION_CUSTOMS_CLEARED,
    PERMISSIONS.PARCELS_TRANSITION_DELIVER,
    PERMISSIONS.BOXES_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.DASHBOARD_VIEW,
  ],

  caissier: [
    PERMISSIONS.PARCELS_READ,
    PERMISSIONS.CASH_READ,
    PERMISSIONS.CASH_OPERATE,
    PERMISSIONS.DASHBOARD_VIEW,
  ],

  manutentionnaire: [
    PERMISSIONS.PARCELS_READ,
    PERMISSIONS.PARCELS_TRANSITION_SCAN_IN_WAREHOUSE,
    PERMISSIONS.PARCELS_TRANSITION_DELIVER,
  ],
}

/**
 * Check if a list of granted permissions covers a required permission.
 * Handles wildcard and dotted prefix matching.
 */
export function hasPermission(granted: readonly string[], required: string): boolean {
  if (granted.includes(WILDCARD_PERMISSION)) return true
  if (granted.includes(required)) return true
  // Allow prefix-based wildcards like "parcels.*"
  return granted.some((g) => g.endsWith('.*') && required.startsWith(g.slice(0, -1)))
}
