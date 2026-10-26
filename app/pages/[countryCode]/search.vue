<script setup lang="ts">
definePageMeta({ cdnCache: true, prefooter: true })

const { t } = useI18n()
const { searchQuery } = useFilters()

const inputValue = ref(searchQuery.value)

watch(searchQuery, (value) => {
  inputValue.value = value
})

const submitSearch = () => {
  searchQuery.value = inputValue.value.trim()
}

const clearSearch = () => {
  inputValue.value = ''
  searchQuery.value = ''
}

useSeoMeta({
  title: t('pages.search.title'),
  ogTitle: t('pages.search.title'),
})
</script>

<template>
  <div>
    <UContainer class="pt-6">
      <nav class="flex items-center gap-2.5 text-[10px]">
        <AppLink to="/" class="text-color-dimmed">
          {{ $t('app.header.home') }}
        </AppLink>
        <span class="text-color-dimmed">/</span>
        <span class="text-color-ink">{{ $t('pages.search.title') }}</span>
      </nav>

      <div class="flex flex-col items-center gap-[22px] py-9 text-center">
        <AppHeading as="h1" variant="display" size="lg">
          {{ $t('pages.search.heading') }}
        </AppHeading>
        <form
          class="flex h-14 w-full max-w-[680px] items-center gap-4 border border-color-ink bg-white pl-5 pr-1.5"
          @submit.prevent="submitSearch"
        >
          <UIcon
            name="i-lucide-search"
            class="size-5 shrink-0 text-color-ink"
          />
          <input
            v-model="inputValue"
            type="search"
            :placeholder="$t('pages.search.placeholder')"
            class="flex-1 bg-transparent text-base text-color-ink placeholder:text-color-dimmed focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ink)"
          />
          <AppIconButton
            v-if="inputValue"
            icon="i-lucide-x"
            :label="$t('pages.search.clear')"
            size="xs"
            class="shrink-0"
            @click="clearSearch"
          />
          <AppButtonPrimary
            type="submit"
            trailing-icon="i-lucide-arrow-right"
            class="shrink-0"
          >
            {{ $t('pages.search.submit') }}
          </AppButtonPrimary>
        </form>
      </div>
    </UContainer>

    <StoreCatalog v-if="searchQuery" :q="searchQuery" />
  </div>
</template>
