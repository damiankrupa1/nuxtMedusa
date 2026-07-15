<script lang="ts" setup>
const items = ref([
  {
    title: 'Github',
    link: 'https://github.com/medusajs',
  },
  {
    title: 'Documentation',
    link: 'https://github.com/medusajs',
  },
])
</script>

<template>
  <div class="flex flex-col gap-y-4">
    <div class="font-medium text-color-dimmed">
      Medusa
    </div>
    <ul class="grid grid-cols-1 gap-y-2">
      <li
        v-for="item in items"
        :key="item.title"
      >
        <NuxtLink
          :href="item.link"
          target="_blank"
          class="hover:text-color-dimmed"
        >
          {{ item.title }}
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
