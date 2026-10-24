<script lang="ts" setup></script>

<template>
  <div class="flex flex-col lg:flex-row gap-y-10 lg:gap-x-16 w-full">
    <AppFooterMenuBrand />
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-10 flex-1">
      <AppFooterMenuCategories />
      <AppFooterMenuHelp />
      <AppFooterMenuWorld />
    </div>
  </div>
</template>
