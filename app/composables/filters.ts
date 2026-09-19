import { SORT_OPTIONS, type SortOptionsType } from '~/types/filter'

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
      if (newPage === 1) {
        delete newQuery.page
      } else {
        newQuery.page = newPage.toString()
      }
      router.push({ query: newQuery })
    },
  })

  const sortBy = computed<SortOptionsType>({
    get: () => {
      return (route.query.sortBy as SortOptionsType) || SORT_OPTIONS.CREATED_AT
    },
    set: async (newSortBy: SortOptionsType) => {
      const newQuery = { ...route.query }
      if (newSortBy === SORT_OPTIONS.CREATED_AT) {
        delete newQuery.sortBy
      } else {
        newQuery.sortBy = newSortBy
      }
      await router.push({ query: newQuery })
      nextTick(() => {
        pageNumber.value = 1
      })
    },
  })

  return { sortOptions, sortBy, pageNumber }
}
