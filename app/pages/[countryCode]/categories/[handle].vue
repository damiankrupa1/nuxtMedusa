<script setup lang="ts">
import { useFetchCategoryByHandle } from '~/composables/category'

definePageMeta({ cdnCache: true, prefooter: true })

const route = useRoute('countryCode-categories-handle')

const handle = computed(() => route.params.handle)
const { data: category, status } = await useFetchCategoryByHandle(handle.value)
useNotFoundWhenMissing(category, status, 'Category not found')
useCountrySeoLinks(() => !!category.value)

useSeoMeta({
  title: () => category.value?.name,
  description: () => category.value?.description ?? undefined,
  ogTitle: () => category.value?.name,
  ogDescription: () => category.value?.description ?? undefined,
})
</script>

<template>
  <StoreCatalog :title="category?.name" :category-id="category?.id" />
</template>
