<script lang="ts" setup>
import type { StoreCartLineItem, StoreOrderLineItem } from '@medusajs/types'

const { item } = defineProps<{
  item?: StoreCartLineItem | StoreOrderLineItem
}>()

const { mutate, loading } = useDeleteLineItem()

const removeItem = () => {
  if (!item) return
  mutate(item?.id)
}
</script>

<template>
  <UButton
    icon="i-lucide-trash-2"
    :loading="loading"
    variant="link"
    color="neutral"
    class="cursor-pointer p-0"
    @click="removeItem()"
  >
    <slot />
  </UButton>
</template>
