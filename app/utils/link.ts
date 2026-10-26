import type {
  AppLinkTarget,
  AppRoute,
  CountryRouteLocation,
} from '~/types/link'

/**
 * Prefixes an `AppLink` target with the country code: a path string becomes
 * `/${countryCode}${path}`, a named route gets `countryCode` as a param.
 *
 * A named route with a missing param (no country yet, a product without a
 * handle) returns `undefined` instead of a location: the router would throw
 * on it while rendering, where a broken path string only 404s.
 */
export function toCountryLink(
  to: string,
  countryCode: string | undefined,
): string
export function toCountryLink(
  to: AppRoute,
  countryCode: string | undefined,
): CountryRouteLocation | undefined
export function toCountryLink(
  to: AppLinkTarget,
  countryCode: string | undefined,
): string | CountryRouteLocation | undefined
export function toCountryLink(
  to: AppLinkTarget,
  countryCode: string | undefined,
): string | CountryRouteLocation | undefined {
  if (typeof to === 'string') return `/${countryCode}${to}`

  const params: Record<string, string | number | null | undefined> = {
    ...to.params,
    countryCode,
  }
  if (
    Object.values(params).some(
      (value) => value === undefined || value === null || value === '',
    )
  ) {
    return undefined
  }

  // Spread loses the per-route pairing of `name` and `params` that the
  // generated route union checks; `AppRoute` already checked it above.
  return { ...to, params } as CountryRouteLocation
}
