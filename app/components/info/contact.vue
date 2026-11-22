<script setup lang="ts">
// The store's contact details from the Payload footer global. Like the
// footer, it renders nothing while Payload has none: there is no fallback.
const { data: footerContent } = useFetchFooterContent()

const contact = computed(() => footerContent.value?.contact ?? null)
const phoneHref = computed(() =>
  contact.value?.phone ? `tel:${contact.value.phone.replace(/\s+/g, '')}` : '',
)
</script>

<template>
  <dl
    v-if="contact"
    class="flex flex-col gap-3 border-l border-color-line pl-5 text-[13px] leading-[1.7]"
  >
    <div v-if="contact.email" class="flex flex-col">
      <dt class="text-[10px] text-color-muted">
        {{ $t('pages.info.contact.email') }}
      </dt>
      <dd>
        <a
          :href="`mailto:${contact.email}`"
          class="text-color-ink underline underline-offset-2 outline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-(--color-ink)"
        >
          {{ contact.email }}
        </a>
      </dd>
    </div>
    <div v-if="contact.phone" class="flex flex-col">
      <dt class="text-[10px] text-color-muted">
        {{ $t('pages.info.contact.phone') }}
      </dt>
      <dd>
        <a
          :href="phoneHref"
          class="text-color-ink underline underline-offset-2 outline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-(--color-ink)"
        >
          {{ contact.phone }}
        </a>
      </dd>
    </div>
    <div v-if="contact.hours" class="flex flex-col">
      <dt class="text-[10px] text-color-muted">
        {{ $t('pages.info.contact.hours') }}
      </dt>
      <dd class="text-color-ink">{{ contact.hours }}</dd>
    </div>
  </dl>
</template>
