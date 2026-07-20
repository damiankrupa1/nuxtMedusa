export const useFetchCountries = () => {
  return useLazyFetch('/api/regions', {
    key: 'countries',
    transform: (data) => getCountriesFromRegions(data?.regions),
  })
}
