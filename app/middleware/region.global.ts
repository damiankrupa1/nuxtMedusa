import type { BaseRegionCountryWithRegionId } from '~/types/country'

export default defineNuxtRouteMiddleware(async (to) => {
  const urlCountryCode = to.path.split('/')[1] || undefined
  const { defaultCountry: defaultCountryCode } = useAppConfig()
  const { countryCode, setCountry } = useCountry()
  const { $i18n } = useNuxtApp()

  const countries = await useCountries()

  const selectCountry = async (country: BaseRegionCountryWithRegionId) => {
    setCountry(country)
    await $i18n.setLocale(getLocaleFromCountryCode(country.iso_2))
  }

  // The URL alone decides the country of a page, so the server renders it
  // the same for every visitor and the CDN can share it
  const urlCountry = getCountryFromCountryCode(countries.value, urlCountryCode)
  if (urlCountry) {
    await selectCountry(urlCountry)
    return
  }

  // Without a known one, redirect. `PL` for the `pl` region keeps that
  // country; otherwise continue in the country the visitor last browsed
  // (ignored if it no longer matches a region), else the default. Only the
  // choice of the target depends on the cookie: the URL alone decides what a
  // page renders.
  const country =
    getCountryFromCountryCodeIgnoreCase(countries.value, urlCountryCode) ??
    getCountryFromCountryCode(countries.value, countryCode.value) ??
    getCountryFromCountryCode(countries.value, defaultCountryCode) ??
    countries.value?.[0]

  // No countries could be loaded (e.g. backend unreachable) — don't redirect
  // to `/undefined/...`.
  if (!country?.iso_2) return

  await selectCountry(country)
  // The redirect target starts with the exact `iso_2` of a region, so the
  // next run takes the branch above: no redirect loop.
  return navigateTo(getCountryRedirectPath(to.fullPath, country.iso_2))
})
