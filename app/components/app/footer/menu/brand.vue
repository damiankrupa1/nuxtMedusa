<script lang="ts" setup>
const items = ref([
  {
    key: 'github',
    titleKey: 'app.footer.github',
    link: 'https://github.com/medusajs',
  },
  {
    key: 'documentation',
    titleKey: 'app.footer.documentation',
    link: 'https://github.com/medusajs',
  },
])
</script>

<template>
  <div class="flex flex-col gap-y-4">
    <div class="font-medium text-color-dimmed">
      {{ $t('app.footer.brandHeading') }}
    </div>
    <ul class="grid grid-cols-1 gap-y-2">
      <li v-for="item in items" :key="item.key">
        <NuxtLink
          :href="item.link"
          target="_blank"
          class="hover:text-color-dimmed"
        >
          {{ $t(item.titleKey) }}
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
