export default defineNuxtRouteMiddleware(async (to) => {
  const newCountryCode = to.path.split('/')[1] || undefined
  const { defaultCountry: defaultCountryCode } = useAppConfig()
  const { countryCode, country, setCountry } = useCountry()
  const { $i18n } = useNuxtApp()

  const syncLocale = (c?: BaseRegionCountryWithRegionId) =>
    $i18n.setLocale(getLocaleFromCountryCode(c?.iso_2))

  const countries = await useCountries()

  const defaultCountry =
    getCountryFromCountryCode(countries.value, defaultCountryCode) ??
    countries.value?.[0]
  const newCountry = getCountryFromCountryCode(countries.value, newCountryCode)

  // Handle User Country from cookie (ignored if it no longer matches a region)
  const userCountry =
    countryCode.value && !country.value
      ? getCountryFromCountryCode(countries.value, countryCode.value)
      : undefined

  if (userCountry) {
    if (userCountry.iso_2 !== newCountryCode) {
      setCountry(userCountry)
      await syncLocale(userCountry)
      return navigateTo(`/${userCountry.iso_2}`)
    }
    setCountry(newCountry)
    await syncLocale(newCountry)
    return
  }

  if (newCountry) {
    // Check if the asked country is valid
    setCountry(newCountry)
    await syncLocale(newCountry)
    return
  }

  // No countries could be loaded (e.g. backend unreachable) — don't redirect
  // to `/undefined/...`.
  if (!defaultCountry) return

  setCountry(defaultCountry)
  await syncLocale(defaultCountry)
  return navigateTo(`/${defaultCountry.iso_2}${to.fullPath}`)
})
