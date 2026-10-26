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

  // Without one, continue in the country the visitor last browsed (ignored
  // if it no longer matches a region), else the default
  const country =
    getCountryFromCountryCode(countries.value, countryCode.value) ??
    getCountryFromCountryCode(countries.value, defaultCountryCode) ??
    countries.value?.[0]

  // No countries could be loaded (e.g. backend unreachable) — don't redirect
  // to `/undefined/...`.
  if (!country) return

  await selectCountry(country)
  return navigateTo(`/${country.iso_2}${to.fullPath}`)
})
