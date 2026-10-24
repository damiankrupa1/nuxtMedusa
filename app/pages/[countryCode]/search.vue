<script setup lang="ts">
definePageMeta({ cdnCache: true })

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
        <h1
          class="font-serif text-4xl leading-[1.05] text-color-ink md:text-5xl lg:text-[56px]"
        >
          {{ $t('pages.search.heading') }}
        </h1>
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
            class="flex-1 bg-transparent text-base text-color-ink placeholder:text-color-dimmed focus:outline-none"
          />
          <button
            v-if="inputValue"
            type="button"
            :aria-label="$t('pages.search.clear')"
            class="shrink-0"
            @click="clearSearch"
          >
            <UIcon name="i-lucide-x" class="size-4 text-color-dimmed" />
          </button>
          <button
            type="submit"
            class="flex h-11 shrink-0 items-center gap-[22px] bg-color-ink px-6 text-xs text-color-paper"
          >
            {{ $t('pages.search.submit') }}
            <UIcon name="i-lucide-arrow-right" class="size-[18px]" />
          </button>
        </form>
      </div>
    </UContainer>

    <StoreCatalog v-if="searchQuery" :q="searchQuery" />
  </div>
</template>
