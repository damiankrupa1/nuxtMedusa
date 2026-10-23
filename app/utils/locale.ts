export const SUPPORTED_LOCALES = ['en', 'pl'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export function getLocaleFromCountryCode(countryCode?: string): SupportedLocale {
  return countryCode === 'pl' ? 'pl' : 'en'
}

// Medusa keeps catalog content in English and serves translations per request
// (Translation Module), selected by the x-medusa-locale header.
const MEDUSA_LOCALES: Record<SupportedLocale, string> = {
  en: 'en-US',
  pl: 'pl-PL',
}

export function toMedusaLocale(locale: string): string {
  return MEDUSA_LOCALES[locale as SupportedLocale] ?? MEDUSA_LOCALES.en
}

export function medusaLocaleHeaders(medusaLocale?: string) {
  return medusaLocale ? { 'x-medusa-locale': medusaLocale } : undefined
}
