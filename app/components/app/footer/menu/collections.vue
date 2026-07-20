<script lang="ts" setup>
import { useFetchCollections } from '~/services/collection.service'

const { data } = await useFetchCollections()
const collections = computed(() => data.value?.collections)
</script>

<template>
  <div class="flex flex-col gap-y-4">
    <div class="font-medium text-color-dimmed">Collections</div>
    <ul class="grid grid-cols-1 gap-y-2">
      <li v-for="collection in collections" :key="collection.id">
        <AppLink :to="`/collections/${collection.handle}`">
          {{ collection.title }}
        </AppLink>
      </li>
    </ul>
  </div>
</template>
