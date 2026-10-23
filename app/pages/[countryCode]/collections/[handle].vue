<script setup lang="ts">
import { useFetchCollectionByHandle } from '~/composables/collection'

definePageMeta({ cdnCache: true })

const route = useRoute()

const handle = computed(() => route.params.handle as string)
const { data: collection, status } = await useFetchCollectionByHandle(
  handle.value,
)
useNotFoundWhenMissing(collection, status, 'Collection not found')

useSeoMeta({
  title: () => collection.value?.title,
  ogTitle: () => collection.value?.title,
})
</script>

<template>
  <StoreCatalog :title="collection?.title" :collection-id="collection?.id" />
</template>
