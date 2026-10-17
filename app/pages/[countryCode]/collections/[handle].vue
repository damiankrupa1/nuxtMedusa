<script setup lang="ts">
import { useFetchCollectionByHandle } from '~/composables/collection'

definePageMeta({ cdnCache: true })

const route = useRoute()

const handle = computed(() => route.params.handle as string)
const { data: collection } = await useFetchCollectionByHandle(handle.value)

useSeoMeta({
  title: () => collection.value?.title,
  ogTitle: () => collection.value?.title,
})
</script>

<template>
  <StoreCatalog :title="collection?.title" :collection-id="collection?.id" />
</template>
