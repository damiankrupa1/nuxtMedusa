<script setup lang="ts">
const route = useRoute()
const { data: categoriesResponse } = await useFetchCategories()

const departments = computed(
  () =>
    categoriesResponse.value?.product_categories
      .filter((category) => !category.parent_category)
      .slice(0, 2) || [],
)

const isActive = (handle: string) => route.path.includes(`/categories/${handle}`)
</script>

<template>
  <div
    v-if="departments.length"
    class="hidden md:flex items-center gap-x-7 w-full md:w-[390px]"
  >
    <AppLink
      v-for="department in departments"
      :key="department.id"
      :to="`/categories/${department.handle}`"
      class="flex flex-col gap-y-2 text-[13px]"
      :class="isActive(department.handle) ? 'text-color-ink font-semibold' : 'text-color-muted'"
    >
      {{ department.name }}
      <span
        v-if="isActive(department.handle)"
        class="h-px w-full bg-color-ink"
      />
    </AppLink>
  </div>
</template>
