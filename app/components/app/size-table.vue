<script setup lang="ts">
// The size table of the product page's "Tabela rozmiarów" modal and of the
// size guide page (/help/size-guide): one table, so the two can't disagree.
defineProps<{
  // Shown above the table on a page; the modal has its own title instead
  caption?: string
}>()

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
  <div class="w-full overflow-x-auto">
    <table class="w-full text-left text-sm text-color-ink">
      <caption
        v-if="caption"
        class="pb-3 text-left text-[13px] leading-[1.7] text-color-muted"
      >
        {{
          caption
        }}
      </caption>
      <thead>
        <tr class="border-b border-color-line">
          <th
            v-for="column in columns"
            :key="column"
            scope="col"
            class="py-2 pr-4 text-xs font-medium"
          >
            {{ $t(`app.sizeTable.${column}`) }}
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
  </div>
</template>
