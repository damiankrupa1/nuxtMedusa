<script setup lang="ts">
import { useFetchCategoryByHandle } from '~/composables/category'

definePageMeta({ cdnCache: true })

const route = useRoute()

const handle = computed(() => route.params.handle as string)
const { data: category, status } = await useFetchCategoryByHandle(handle.value)
useNotFoundWhenMissing(category, status, 'Category not found')

useSeoMeta({
  title: () => category.value?.name,
  description: () => category.value?.description ?? undefined,
  ogTitle: () => category.value?.name,
  ogDescription: () => category.value?.description ?? undefined,
})
</script>

<template>
  <div>
    <StoreCatalog :title="category?.name" :category-id="category?.id" />
    <AppBenefitsBar />
    <AppNewsletter />
  </div>
</template>
