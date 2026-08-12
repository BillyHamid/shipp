/**
 * WebSocket event contracts shared between API and clients.
 */

import type { ParcelState, PaymentState } from './domain.js'

// ─── Channels ────────────────────────────────────────────────────────────────

export const WS_NAMESPACES = {
  ADMIN: '/admin',
  TRACK: '/track',
} as const

// ─── Server → Client events (ADMIN namespace) ────────────────────────────────

export interface ParcelUpdatedEvent {
  parcelId: string
  trackingNumber: string
  fromState: ParcelState | null
  toState: ParcelState
  occurredAt: string // ISO
  actorName: string
}

export interface PaymentUpdatedEvent {
  parcelId: string
  trackingNumber: string
  paymentState: PaymentState
  amountUsd: number
  amountXof: number
  occurredAt: string
}

export interface BoxUpdatedEvent {
  boxId: string
  reference: string
  status: string
}

export interface DashboardInvalidateEvent {
  reason: 'parcel_change' | 'payment_change' | 'box_change'
}

// ─── Server → Client events (TRACK namespace, public) ────────────────────────

export interface PublicTrackingUpdateEvent {
  trackingNumber: string
  currentState: ParcelState
  occurredAt: string
}

// ─── Client → Server events ──────────────────────────────────────────────────

export interface TrackingSubscribeEvent {
  trackingNumber: string
}

// ─── Event names ─────────────────────────────────────────────────────────────

export const WS_EVENTS = {
  // Admin namespace
  PARCEL_UPDATED: 'parcel:updated',
  PAYMENT_UPDATED: 'payment:updated',
  BOX_UPDATED: 'box:updated',
  DASHBOARD_INVALIDATE: 'dashboard:invalidate',

  // Track namespace
  TRACK_SUBSCRIBE: 'track:subscribe',
  TRACK_UNSUBSCRIBE: 'track:unsubscribe',
  TRACK_UPDATE: 'track:update',
} as const

export type WsEventName = (typeof WS_EVENTS)[keyof typeof WS_EVENTS]
