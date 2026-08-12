/**
 * Minimal country → calling code map, covering the corridors GSG actually
 * operates (USA ↔ West Africa). Extend as new routes open.
 *
 * Keyed loosely (accepts the free-text country names used elsewhere in the
 * legacy data, e.g. "Etats-unis", "Burkina-faso") — normalized to lowercase
 * without accents/hyphens for lookup.
 */
const CALLING_CODES: Record<string, string> = {
  'etats-unis': '1',
  'usa': '1',
  'us': '1',
  'united states': '1',
  'burkina-faso': '226',
  'burkina faso': '226',
  'bf': '226',
  'cote-divoire': '225',
  "cote d'ivoire": '225',
  'ci': '225',
  'mali': '223',
  'senegal': '221',
  'togo': '228',
  'benin': '229',
  'ghana': '233',
  'niger': '227',
  'guinee': '224',
  'france': '33',
}

function normalizeKey(country: string): string {
  return country.trim().toLowerCase()
}

export function callingCodeForCountry(country: string): string | null {
  return CALLING_CODES[normalizeKey(country)] ?? null
}
