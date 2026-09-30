/**
 * Core domain types — single source of truth for parcel states,
 * roles, and actions across the entire system.
 */

// ─── Parcel state machine ────────────────────────────────────────────────────

export const PARCEL_STATES = [
  'registered',          // Colis enregistré dans le système
  'received_warehouse',  // Reçu dans l'entrepôt USA
  'preparing',           // Affecté à une BOX, en préparation
  'shipped',             // BOX expédiée depuis l'origine
  'in_transit',          // En transit international
  'arrived_country',     // BOX arrivée au pays de destination
  'customs',             // En dédouanement
  'out_for_delivery',    // Prêt pour retrait / livraison
  'delivered',           // Récupéré par le destinataire
  'cancelled',           // Annulé (terminal)
] as const

export type ParcelState = (typeof PARCEL_STATES)[number]

export const TERMINAL_PARCEL_STATES: readonly ParcelState[] = ['delivered', 'cancelled']

export function isTerminalState(state: ParcelState): boolean {
  return TERMINAL_PARCEL_STATES.includes(state)
}

// Human-readable labels (FR)
export const PARCEL_STATE_LABELS: Record<ParcelState, string> = {
  registered: 'Enregistré',
  received_warehouse: 'Reçu entrepôt',
  preparing: 'En préparation',
  shipped: 'Expédié',
  in_transit: 'En transit',
  arrived_country: 'Arrivé pays destination',
  customs: 'En dédouanement',
  out_for_delivery: 'En livraison',
  delivered: 'Livré',
  cancelled: 'Annulé',
}

// ─── Payment state ───────────────────────────────────────────────────────────

export const PAYMENT_STATES = ['pending', 'partial', 'paid', 'refunded', 'waived'] as const
export type PaymentState = (typeof PAYMENT_STATES)[number]

export const PAYMENT_STATE_LABELS: Record<PaymentState, string> = {
  pending: 'En attente',
  partial: 'Partiel',
  paid: 'Payé',
  refunded: 'Remboursé',
  waived: 'Offert',
}

export const PAYMENT_MODES = ['cash', 'mobile_money', 'bank_transfer', 'card'] as const
export type PaymentMode = (typeof PAYMENT_MODES)[number]

// When in the parcel's journey the customer pays — at drop-off (prepaid) or
// at pickup (cash on delivery). Purely informational/filterable; it does not
// change how the partner revenue split works (that's tied to the actual
// payment event, whenever it happens).
export const PAYMENT_TIMINGS = ['at_shipping', 'at_arrival'] as const
export type PaymentTiming = (typeof PAYMENT_TIMINGS)[number]

export const PAYMENT_TIMING_LABELS: Record<PaymentTiming, string> = {
  at_shipping: "Paiement à l'envoi",
  at_arrival: "Paiement à l'arrivée",
}

// ─── Parcel transitions (state machine vocabulary) ───────────────────────────

export const PARCEL_ACTIONS = [
  'scan_in_warehouse',
  'assign_to_box',
  'box_departed',
  'in_flight',
  'box_arrived',
  'declare_customs',
  'customs_cleared',
  'deliver',
  'cancel',
] as const

export type ParcelAction = (typeof PARCEL_ACTIONS)[number]

export interface ParcelTransition {
  from: ParcelState | '*'
  to: ParcelState
  action: ParcelAction
  /** Required metadata keys on the transition request */
  requires?: ReadonlyArray<'photo' | 'recipient_signature' | 'reason' | 'box_id' | 'geo'>
}

/**
 * THE STATE MACHINE.
 * Wildcard `*` matches any non-terminal state.
 * Order matters: first match wins on conflict.
 */
export const PARCEL_TRANSITIONS: readonly ParcelTransition[] = [
  { from: 'registered', to: 'received_warehouse', action: 'scan_in_warehouse' },
  { from: 'received_warehouse', to: 'preparing', action: 'assign_to_box', requires: ['box_id'] },
  { from: 'preparing', to: 'shipped', action: 'box_departed' },
  { from: 'shipped', to: 'in_transit', action: 'in_flight' },
  { from: 'in_transit', to: 'arrived_country', action: 'box_arrived' },
  { from: 'arrived_country', to: 'customs', action: 'declare_customs' },
  { from: 'customs', to: 'out_for_delivery', action: 'customs_cleared' },
  {
    from: 'out_for_delivery',
    to: 'delivered',
    action: 'deliver',
    requires: ['photo', 'recipient_signature'],
  },
  { from: '*', to: 'cancelled', action: 'cancel', requires: ['reason'] },
] as const

// ─── Roles ───────────────────────────────────────────────────────────────────

export const ROLES = [
  'super_admin',
  'admin_global',
  'agent_usa',
  'agent_bf',
  'caissier',
  'manutentionnaire',
] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super administrateur',
  admin_global: 'Administrateur global',
  agent_usa: 'Agent USA',
  agent_bf: 'Agent Burkina Faso',
  caissier: 'Caissier',
  manutentionnaire: 'Manutentionnaire',
}

// ─── Box ─────────────────────────────────────────────────────────────────────

export const BOX_TYPES = ['CARGO', 'EXPRESS'] as const
export type BoxType = (typeof BOX_TYPES)[number]

export const BOX_STATUSES = ['open', 'shipped', 'in_transit', 'arrived', 'closed'] as const
export type BoxStatus = (typeof BOX_STATUSES)[number]

// ─── Parcel categories (matches pricing rules) ───────────────────────────────

export const PARCEL_CATEGORIES = [
  'PHONE',
  'ELECTRONICS',
  'COMPUTER',
  'COSMETICS',
  'FOOD',
  'CLOTHING',
  'DOCUMENTS',
  'OTHER',
] as const

export type ParcelCategory = (typeof PARCEL_CATEGORIES)[number]

export const PARCEL_CATEGORY_LABELS: Record<ParcelCategory, string> = {
  PHONE: 'Téléphone',
  ELECTRONICS: 'Électronique',
  COMPUTER: 'Ordinateur',
  COSMETICS: 'Cosmétique',
  FOOD: 'Alimentaire',
  CLOTHING: 'Vêtements',
  DOCUMENTS: 'Documents',
  OTHER: 'Autres',
}

// ─── Currencies ──────────────────────────────────────────────────────────────

export const CURRENCIES = ['USD', 'XOF', 'EUR'] as const
export type Currency = (typeof CURRENCIES)[number]

// ─── Countries ───────────────────────────────────────────────────────────────

/**
 * The single source of truth for country codes across the system.
 * ISO 3166-1 alpha-2, uppercase. Every field that stores a country
 * (Customer.country, Parcel.originCountry/destCountry, Box.originCountry/
 * destCountry, PricingRule.originCountry/destCountry) MUST use one of these
 * codes — never a free-text country name.
 *
 * Kept intentionally small and curated to the corridors GSG actually
 * operates (USA ↔ West Africa). Extend when a new route opens.
 */
export const COUNTRIES = [
  'US', 'BF', 'CI', 'ML', 'SN', 'TG', 'BJ', 'GH', 'NE', 'GN', 'FR',
] as const

export type CountryCode = (typeof COUNTRIES)[number]

export const COUNTRY_LABELS: Record<CountryCode, string> = {
  US: 'États-Unis',
  BF: 'Burkina Faso',
  CI: "Côte d'Ivoire",
  ML: 'Mali',
  SN: 'Sénégal',
  TG: 'Togo',
  BJ: 'Bénin',
  GH: 'Ghana',
  NE: 'Niger',
  GN: 'Guinée',
  FR: 'France',
}
