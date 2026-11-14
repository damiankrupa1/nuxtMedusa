import type { StoreRegion } from '@medusajs/types'
import type { BaseRegionCountryWithRegionId } from '~/types/country'

export function getCountryFromCountryCode(
  countries?: BaseRegionCountryWithRegionId[],
  countryCode?: string,
) {
  if (!countryCode) return

  return countries?.find((country) => country?.iso_2 === countryCode)
}

/**
 * Like `getCountryFromCountryCode()`, but `PL` finds the `pl` region too.
 * Used only to pick where an unknown URL country is redirected to, never to
 * accept a URL as a country: a page URL has to carry the exact `iso_2`.
 */
export function getCountryFromCountryCodeIgnoreCase(
  countries?: BaseRegionCountryWithRegionId[],
  countryCode?: string,
) {
  if (!countryCode) return

  const wanted = countryCode.toLowerCase()
  return countries?.find((country) => country?.iso_2?.toLowerCase() === wanted)
}

// A first path segment of exactly two ASCII letters, in any case: what a
// visitor types for a country (`/xx/store`). `pl-PL`, `xxx` and `store` don't
// match, so they are treated as a path without a country.
const COUNTRY_CODE_SEGMENT = /^\/[a-z]{2}(?=[/?#]|$)/i

/**
 * The URL to redirect `fullPath` (path + query + hash) to so that it sits
 * under `iso2`. A first segment that looks like a country code is replaced
 * (`/xx/store?x=1` -> `/pl/store?x=1`); anything else gets the prefix
 * (`/store` -> `/pl/store`). The caller must have checked that the segment is
 * not a known country: `/pl/store` for `pl` would be replaced by itself.
 */
export function getCountryRedirectPath(fullPath: string, iso2: string) {
  return `/${iso2}${fullPath.replace(COUNTRY_CODE_SEGMENT, '')}`
}

export function getCountriesFromRegions(regions?: StoreRegion[]) {
  if (!regions) {
    return []
  }

  return regions
    .map((region: StoreRegion) => region.countries)
    .flat()
    .filter(
      (country): country is BaseRegionCountryWithRegionId & { name: string } =>
        Boolean(country?.name),
    )
    .sort((a, b) => a.name.localeCompare(b.name))
}
