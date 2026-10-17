<script lang="ts" setup>
import type { InpostPoint } from '~/utils/inpost'

const point = defineModel<InpostPoint | null>({ required: true })

const isPickerOpen = ref(false)

const pointAddress = computed(() =>
  point.value ? formatInpostPointAddress(point.value) : '',
)

// The form renders this only while InPost is selected, so ask for a parcel
// locker as soon as it shows up without one.
onMounted(() => {
  if (!point.value) isPickerOpen.value = true
})

function selectPoint(selected: InpostPoint) {
  point.value = selected
  isPickerOpen.value = false
}
</script>

<template>
  <div
    class="flex items-center justify-between gap-x-4 p-4 rounded-lg border border-neutral-200"
  >
    <div v-if="point">
      <div class="font-semibold text-black">
        {{ $t('checkout.delivery.inpost.selectedPoint', { name: point.name }) }}
      </div>
      <div v-if="pointAddress" class="text-sm text-neutral-500">
        {{ pointAddress }}
      </div>
    </div>
    <div v-else class="text-neutral-500">
      {{ $t('checkout.delivery.inpost.noPointSelected') }}
    </div>
    <UButton
      class="cursor-pointer shrink-0"
      variant="link"
      color="primary"
      @click="isPickerOpen = true"
    >
      {{
        point
          ? $t('checkout.delivery.inpost.changePoint')
          : $t('checkout.delivery.inpost.choosePoint')
      }}
    </UButton>

    <UModal
      v-model:open="isPickerOpen"
      :title="$t('checkout.delivery.inpost.modalTitle')"
      :description="$t('checkout.delivery.inpost.modalDescription')"
      :ui="{ content: 'sm:max-w-7xl' }"
    >
      <template #body>
        <CheckoutDeliveryInpostPicker @select="selectPoint" />
      </template>
    </UModal>
  </div>
</template>
