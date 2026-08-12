/**
 * Zod schemas for runtime validation.
 * Used by the API for DTOs and by clients for form validation.
 */

import { z } from 'zod'
import {
  BOX_TYPES,
  COUNTRIES,
  CURRENCIES,
  PARCEL_ACTIONS,
  PARCEL_CATEGORIES,
  PARCEL_STATES,
  PAYMENT_MODES,
  PAYMENT_STATES,
  ROLES,
} from './domain.js'

// ─── Primitives ──────────────────────────────────────────────────────────────

export const TrackingNumberSchema = z
  .string()
  .regex(/^GSG-[A-Z]{2}-[A-HJ-NP-Z2-9]{8}$/, 'Invalid tracking number format')

export const BoxReferenceSchema = z
  .string()
  .regex(/^BOX-[A-Z]+-\d{4}-\d{6}$/, 'Invalid box reference format')

export const MoneySchema = z.number().nonnegative().finite()

/** ISO 3166-1 alpha-2 country code, constrained to COUNTRIES — never free text. */
export const CountryCodeSchema = z.enum(COUNTRIES)

// ─── Auth ────────────────────────────────────────────────────────────────────

export const LoginDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
export type LoginDto = z.infer<typeof LoginDtoSchema>

// ─── Customer ────────────────────────────────────────────────────────────────

export const CreateCustomerDtoSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(6).max(30),
  email: z.string().email().optional().nullable(),
  country: CountryCodeSchema,
  address: z.string().max(255).optional().nullable(),
})
export type CreateCustomerDto = z.infer<typeof CreateCustomerDtoSchema>

// ─── Box ─────────────────────────────────────────────────────────────────────

export const CreateBoxDtoSchema = z.object({
  type: z.enum(BOX_TYPES),
  capacityKg: z.number().positive(),
  originCountry: CountryCodeSchema,
  destCountry: CountryCodeSchema,
})
export type CreateBoxDto = z.infer<typeof CreateBoxDtoSchema>

// ─── Parcel ──────────────────────────────────────────────────────────────────

export const CreateParcelDtoSchema = z.object({
  senderId: z.string().uuid(),
  recipientId: z.string().uuid(),
  category: z.enum(PARCEL_CATEGORIES),
  description: z.string().max(500).optional().nullable(),
  weightKg: z.number().positive(),
  declaredValue: MoneySchema.optional().nullable(),
  originCountry: CountryCodeSchema,
  destCountry: CountryCodeSchema,
})
export type CreateParcelDto = z.infer<typeof CreateParcelDtoSchema>

export const TransitionMetadataSchema = z.object({
  scanned: z.boolean().optional(),
  reason: z.string().max(500).optional(),
  boxId: z.string().uuid().optional(),
  photo: z.string().optional(), // base64 dataURL or storage key
  recipientSignature: z.string().optional(),
  geo: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
})
export type TransitionMetadata = z.infer<typeof TransitionMetadataSchema>

export const TransitionParcelDtoSchema = z.object({
  action: z.enum(PARCEL_ACTIONS),
  metadata: TransitionMetadataSchema.default({}),
})
export type TransitionParcelDto = z.infer<typeof TransitionParcelDtoSchema>

// ─── Payment ─────────────────────────────────────────────────────────────────

export const RecordPaymentDtoSchema = z.object({
  parcelId: z.string().uuid(),
  amountUsd: MoneySchema,
  mode: z.enum(PAYMENT_MODES),
  cashAccountId: z.string().uuid().optional(),
})
export type RecordPaymentDto = z.infer<typeof RecordPaymentDtoSchema>

// ─── Cash ────────────────────────────────────────────────────────────────────

export const CreateCashOperationDtoSchema = z.object({
  accountId: z.string().uuid(),
  type: z.enum(['inflow', 'outflow', 'transfer']),
  label: z.string().min(2).max(255),
  amount: MoneySchema.refine((v) => v > 0, 'Amount must be > 0'),
  referenceId: z.string().optional().nullable(),
})
export type CreateCashOperationDto = z.infer<typeof CreateCashOperationDtoSchema>

// ─── Pricing ─────────────────────────────────────────────────────────────────

export const QuotePriceDtoSchema = z.object({
  category: z.enum(PARCEL_CATEGORIES),
  weightKg: z.number().positive(),
  originCountry: CountryCodeSchema,
  destCountry: CountryCodeSchema,
})
export type QuotePriceDto = z.infer<typeof QuotePriceDtoSchema>

// ─── User ────────────────────────────────────────────────────────────────────

export const CreateUserDtoSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(120),
  role: z.enum(ROLES),
  country: CountryCodeSchema.optional().nullable(),
  password: z.string().min(10),
})
export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>

// Re-export some primitive enums for convenience
export const ParcelStateEnum = z.enum(PARCEL_STATES)
export const PaymentStateEnum = z.enum(PAYMENT_STATES)
export const CurrencyEnum = z.enum(CURRENCIES)
