<script setup lang="ts">
const { title } = useAppConfig()

const isSideMenuOpen = ref(false)
</script>

<template>
  <div class="sticky top-0 inset-x-0 z-50">
    <header class="duration-200 bg-color-paper">
      <AppHeaderAnnouncementBar />
      <div class="h-[88px] flex items-center justify-between px-6 md:px-16">
        <div class="flex items-center gap-x-6 flex-1 min-w-0">
          <button
            type="button"
            class="cursor-pointer text-xs md:hidden"
            @click="isSideMenuOpen = !isSideMenuOpen"
          >
            {{ $t('app.header.menu') }}
          </button>
          <AppHeaderDepartments />
        </div>
        <AppLink
          to="/"
          class="uppercase text-2xl md:text-4xl font-medium text-color-ink shrink-0"
        >
          {{ title }}
        </AppLink>
        <nav
          class="flex items-center gap-x-4 md:gap-x-6 flex-1 min-w-0 justify-end text-xs text-color-ink"
        >
          <AppLink
            to="/store"
            class="hidden sm:flex items-center gap-x-2"
          >
            <UIcon name="i-lucide-search" class="size-5" />
            <span class="text-color-muted">{{ $t('app.header.search') }}</span>
          </AppLink>
          <AppLink to="/account" class="hidden sm:flex">
            <UIcon name="i-lucide-user-round" class="size-[21px]" />
          </AppLink>
          <AppLink to="/account" class="hidden sm:flex">
            <UIcon name="i-lucide-heart" class="size-[21px]" />
          </AppLink>
          <ClientOnly>
            <LazyCartDropdown />
            <template #fallback>
              <AppLink to="/cart" class="flex items-center gap-x-[7px]">
                <UIcon name="i-lucide-shopping-bag" class="size-[21px]" />
                <span>(0)</span>
              </AppLink>
            </template>
          </ClientOnly>
        </nav>
      </div>
      <AppHeaderCategoryNav />
      <AppHeaderSideMenu v-model="isSideMenuOpen" />
    </header>
  </div>
</template>
