import type { ParcelState } from '@gsg/shared-types/domain'

/**
 * Rough ETA heuristic based on typical USA↔Burkina Faso transit times.
 * This is intentionally simple for S2; a data-driven model (based on
 * historical transition timestamps per route) is a good future upgrade.
 */
const DAYS_TO_ADD: Partial<Record<ParcelState, number>> = {
  registered: 12,
  received_warehouse: 10,
  preparing: 9,
  shipped: 7,
  in_transit: 4,
  arrived_country: 2,
  customs: 1,
  out_for_delivery: 0,
}

export function estimateDeliveryDate(currentState: ParcelState, from: Date = new Date()): Date | null {
  const daysLeft = DAYS_TO_ADD[currentState]
  if (daysLeft === undefined) return null
  const eta = new Date(from)
  eta.setDate(eta.getDate() + daysLeft)
  return eta
}
