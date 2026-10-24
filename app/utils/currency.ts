// TODO: BaseRegionCountryWithRegionId (app/utils/country.ts) carries no
// currency field — see missing-medusa-api-data skill. Mocked from a small
// iso2 -> currency map until the region's currency_code is exposed by
// useFetchCountries()/useCountry().
const currencyByCountry: Record<string, string> = {
  pl: 'PLN',
  us: 'USD',
  gb: 'GBP',
}

export const getMockCurrencyCode = (iso2?: string) =>
  currencyByCountry[iso2 || ''] || ''
