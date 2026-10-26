<script lang="ts" setup>
const { data: categoriesResponse } = await useFetchCategories()

const departments = computed(
  () =>
    categoriesResponse.value?.product_categories
      .filter((category) => !category.parent_category)
      .slice(0, 2) || [],
)

// TODO: "Wszystkie marki" (brand directory) and "Karty podarunkowe" (gift
// cards) have no backing route/feature yet — see missing-cms-content and
// missing-medusa-api-data skills.
</script>

<template>
  <div class="flex flex-col gap-y-5">
    <p class="text-[10px] text-color-paper">
      {{ $t('app.footer.shopping.heading') }}
    </p>
    <ul class="flex flex-col gap-y-5 text-xs text-color-sage">
      <li v-for="department in departments" :key="department.id">
        <AppLink :to="`/categories/${department.handle}`">
          {{ department.name }}
        </AppLink>
      </li>
      <li>
        <AppLink to="/store">{{ $t('app.footer.shopping.newIn') }}</AppLink>
      </li>
      <li>
        <AppLink to="/store">{{ $t('app.footer.shopping.allBrands') }}</AppLink>
      </li>
      <li>
        <AppLink to="/store">{{ $t('app.footer.shopping.giftCards') }}</AppLink>
      </li>
    </ul>
  </div>
</template>
