import { categoryRepository } from '../repository/category.repository'

export const useFetchCategories = () => {
  const { locale } = useI18n()
  const { listCategories } = categoryRepository()
  const medusaLocale = toMedusaLocale(locale.value)

  return useLazyAsyncData(`categories:${medusaLocale}`, async () => {
    return await listCategories(undefined, medusaLocale)
  })
}

// The "Kobieta/Mężczyzna" department pair shown in the header, campaign CTA
// and new-arrivals tabs. Picks top-level categories by the conventional
// `women`/`men` handles so it doesn't depend on API list order; falls back
// to the first two top-level categories for a catalog without them.
export const useDepartmentCategories = async () => {
  const { data: categoriesResponse } = await useFetchCategories()

  const topLevel = computed(
    () =>
      categoriesResponse.value?.product_categories.filter(
        (category) => !category.parent_category,
      ) || [],
  )

  const women = computed(
    () =>
      topLevel.value.find((category) => category.handle === 'women') ??
      topLevel.value[0] ??
      null,
  )
  const men = computed(
    () =>
      topLevel.value.find((category) => category.handle === 'men') ??
      topLevel.value[1] ??
      null,
  )

  return { women, men }
}

export const useFetchCategoryByHandle = (handle: string) => {
  const { locale } = useI18n()
  const { fetchCategoryByHandle } = categoryRepository()
  const medusaLocale = toMedusaLocale(locale.value)

  return useLazyAsyncData(
    `category:${handle}:${medusaLocale}`,
    async () => await fetchCategoryByHandle(handle, medusaLocale),
  )
}
