<script setup lang="ts">
import type { StoreProductOption } from '@medusajs/types'

const {
  option,
  current,
  unavailable = [],
} = defineProps<{
  option: StoreProductOption
  current?: string
  // Values that no in-stock variant has with the other selected options.
  unavailable?: string[]
}>()

defineEmits<{
  'select:option': [{ optionId: string; value: string }]
}>()

const isColor = computed(() => isColorOption(option))

const optionValues = computed(() =>
  sortOptionValues(option.values?.map((v) => v.value) ?? []),
)

const labelId = useId()

const swatchColor = (value: string) => getSwatchColor(value)
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-baseline justify-between gap-4">
      <p :id="labelId" class="text-xs leading-[1.5] text-color-ink">
        <template v-if="isColor">
          {{ option.title }}<template v-if="current">: {{ current }}</template>
        </template>
        <template v-else>
          {{ $t('product.optionSelector.select', { option: option.title }) }}
        </template>
      </p>
      <slot name="action" />
    </div>
    <!--
      TODO(#59): the design has no unavailable state; a sold-out value is
      disabled and struck through (colors dimmed). The border is --color-line
      (#dcdad2), the design's is #dcd8d0.
    -->
    <div role="group" :aria-labelledby="labelId" class="flex flex-wrap gap-2.5">
      <button
        v-for="value in optionValues"
        :key="value"
        type="button"
        :aria-pressed="current === value"
        :aria-label="isColor ? value : undefined"
        :disabled="unavailable.includes(value)"
        class="cursor-pointer outline-offset-2 focus-visible:outline-2 focus-visible:outline-(--color-ink) disabled:cursor-not-allowed"
        :class="
          isColor
            ? [
                'flex size-8 items-center justify-center rounded-full border disabled:opacity-40',
                current === value ? 'border-color-ink' : 'border-transparent',
              ]
            : [
                'h-[46px] min-w-[62px] border px-3 text-xs',
                current === value
                  ? 'border-color-ink bg-color-ink text-color-paper'
                  : 'border-color-line bg-transparent text-color-ink disabled:text-color-muted',
                'disabled:line-through',
              ]
        "
        @click="$emit('select:option', { optionId: option.id, value })"
      >
        <span
          v-if="isColor"
          class="size-6 rounded-full border border-color-line"
          :style="{ backgroundColor: swatchColor(value) }"
        />
        <template v-else>{{ value }}</template>
      </button>
    </div>
  </div>
</template>
