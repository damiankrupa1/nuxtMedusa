import { countryRepository } from '~/repository/country.repository'
import { getCountriesFromRegions } from '~/utils/country'
import type { BaseRegionCountryWithRegionId } from '~/types/country'

export const useCountry = () => {
  const countryCodeFromCookie = useCookie('country_code', {
    maxAge: 60 * 60 * 24 * 365,
  })
  const country = useState<BaseRegionCountryWithRegionId | null>(
    'country',
    () => null,
  )

  const setCountry = (newCountry?: BaseRegionCountryWithRegionId) => {
    if (!newCountry) return null
    country.value = newCountry
    // Saved by the browser only: a Set-Cookie would keep the server-rendered
    // page out of the CDN cache
    if (import.meta.client) countryCodeFromCookie.value = newCountry.iso_2
  }

  return {
    countryCode: computed(() => countryCodeFromCookie.value || undefined),
    country: readonly(country),
    setCountry: setCountry,
  }
}

export const useFetchCountries = () => {
  const { listCountries } = countryRepository()

  return useLazyAsyncData(
    'countries',
    async () => {
      const response = await listCountries()
      return getCountriesFromRegions(response.regions)
    },
    {
      default: () => undefined,
    },
  )
}

export const useCountries = async () => {
  const NuxtApp = useNuxtApp()
  const countries = ref<BaseRegionCountryWithRegionId[] | undefined>(
    NuxtApp.payload.data['countries'],
  )

  if (!countries.value) {
    const { data } = await useFetchCountries()
    countries.value = data.value
  }

  return countries
}
