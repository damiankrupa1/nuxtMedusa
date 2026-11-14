<script setup lang="ts">
// TODO(#58): mock. These measurements are made up, not the store's: the real
// table is the `SizeGuide` Global (damiankrupa1/simple-landing-page-nuxt#28).
const rows = [
  { size: 'XS', chest: '80–84', waist: '62–66', hips: '86–90' },
  { size: 'S', chest: '84–88', waist: '66–70', hips: '90–94' },
  { size: 'M', chest: '88–92', waist: '70–74', hips: '94–98' },
  { size: 'L', chest: '92–98', waist: '74–80', hips: '98–104' },
  { size: 'XL', chest: '98–104', waist: '80–86', hips: '104–110' },
]

const columns = ['size', 'chest', 'waist', 'hips'] as const
</script>

<template>
  <UModal
    :title="$t('product.sizeGuide.title')"
    :description="$t('product.sizeGuide.description')"
  >
    <button
      type="button"
      class="cursor-pointer text-[11px] leading-[1.5] text-color-muted underline underline-offset-2 outline-offset-2 hover:text-color-ink focus-visible:outline-2 focus-visible:outline-(--color-ink)"
    >
      {{ $t('product.sizeGuide.link') }}
    </button>

    <template #body>
      <table class="w-full text-left text-sm text-color-ink">
        <thead>
          <tr class="border-b border-color-line">
            <th
              v-for="column in columns"
              :key="column"
              scope="col"
              class="py-2 pr-4 text-xs font-medium"
            >
              {{ $t(`product.sizeGuide.${column}`) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.size"
            class="border-b border-color-line"
          >
            <th scope="row" class="py-2 pr-4 font-medium">{{ row.size }}</th>
            <td class="py-2 pr-4">{{ row.chest }}</td>
            <td class="py-2 pr-4">{{ row.waist }}</td>
            <td class="py-2 pr-4">{{ row.hips }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </UModal>
</template>
