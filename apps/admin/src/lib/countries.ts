import { COUNTRIES, COUNTRY_LABELS, type CountryCode } from '@gsg/shared-types/domain'

/** [code, label] pairs ready for a <select> — single source of truth is @gsg/shared-types. */
export const COUNTRY_OPTIONS: [string, string][] = COUNTRIES.map((code) => [code, COUNTRY_LABELS[code]])

/**
 * Look up a country label from a value that's only known to be a `string`
 * at compile time (e.g. straight off an untyped API response). Falls back
 * to the raw code if it's not one of our known countries, rather than
 * throwing — display code, not validation.
 */
export function countryLabel(code: string | null | undefined): string {
  if (!code) return '—'
  return COUNTRY_LABELS[code as CountryCode] ?? code
}
