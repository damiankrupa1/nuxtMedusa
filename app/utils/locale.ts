export const SUPPORTED_LOCALES = ['en', 'pl'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export function getLocaleFromCountryCode(countryCode?: string): SupportedLocale {
  return countryCode === 'pl' ? 'pl' : 'en'
}
