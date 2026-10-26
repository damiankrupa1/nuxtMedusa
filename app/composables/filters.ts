import type { LocationQuery } from '#vue-router'
import { SORT_OPTIONS, type SortOptionsType } from '~/types/filter'

// Shared by every query-param toggle below: set it when it's not the
// default value, otherwise drop it so the URL doesn't carry redundant
// params (e.g. no ?page=1 or ?sortBy=created_at).
function setOrDeleteQueryParam(
  query: LocationQuery,
  key: string,
  value: string,
  isDefault: boolean,
) {
  if (isDefault) Reflect.deleteProperty(query, key)
  else query[key] = value
}

export const useFilters = () => {
  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()

  const sortOptions = computed(() => [
    { value: SORT_OPTIONS.CREATED_AT, label: t('store.sort.latest') },
    { value: SORT_OPTIONS.PRICE_ASC, label: t('store.sort.priceAsc') },
    { value: SORT_OPTIONS.PRICE_DESC, label: t('store.sort.priceDesc') },
  ])

  const pageNumber = computed<number>({
    get: () => {
      return route.query.page ? parseInt(route.query.page as string) : 1
    },
    set: (newPage: number) => {
      const newQuery = { ...route.query }
      setOrDeleteQueryParam(newQuery, 'page', newPage.toString(), newPage === 1)
      router.push({ query: newQuery })
    },
  })

  const sortBy = computed<SortOptionsType>({
    get: () => {
      return (route.query.sortBy as SortOptionsType) || SORT_OPTIONS.CREATED_AT
    },
    set: async (newSortBy: SortOptionsType) => {
      const newQuery = { ...route.query }
      setOrDeleteQueryParam(
        newQuery,
        'sortBy',
        newSortBy,
        newSortBy === SORT_OPTIONS.CREATED_AT,
      )
      await router.push({ query: newQuery })
      nextTick(() => {
        pageNumber.value = 1
      })
    },
  })

  const searchQuery = computed<string>({
    get: () => (route.query.q as string) || '',
    set: async (newQuery: string) => {
      const newQueryParams = { ...route.query }
      if (newQuery) {
        newQueryParams.q = newQuery
      } else {
        delete newQueryParams.q
      }
      await router.push({ query: newQueryParams })
      nextTick(() => {
        pageNumber.value = 1
      })
    },
  })

  return { sortOptions, sortBy, pageNumber, searchQuery }
}
