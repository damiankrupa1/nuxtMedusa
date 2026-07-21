<script setup lang="ts">
import { useFetchCategoryByHandle } from '~/composables/category'

const route = useRoute()

const handle = computed(() => route.params.handle as string)
const { data: category } = await useFetchCategoryByHandle(handle.value)

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
