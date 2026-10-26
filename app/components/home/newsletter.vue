<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const { title } = useAppConfig()
const { t } = useI18n()

const buildSchema = () =>
  z.object({
    email: z.email(t('pages.home.newsletter.errorEmail')),
    consent: z.boolean().refine((value) => value === true, {
      message: t('pages.home.newsletter.errorConsent'),
    }),
  })

type NewsletterForm = z.infer<ReturnType<typeof buildSchema>>
const schema = computed(buildSchema)

const state = reactive<NewsletterForm>({
  email: '',
  consent: false,
})
const interestedWomen = ref(false)
const interestedMen = ref(false)
const submitted = ref(false)

// No newsletter backend/composable exists in this codebase — see
// missing-medusa-api-data skill. Presentational only, no network call.
const onSubmit = (_event: FormSubmitEvent<NewsletterForm>) => {
  submitted.value = true
}
</script>

<template>
  <section
    class="flex flex-col gap-10 bg-color-stone px-6 py-14 md:flex-row md:gap-[100px] md:px-24 md:py-[72px]"
  >
    <div class="flex flex-col gap-[19px] md:w-[530px] md:shrink-0">
      <p class="text-[10px] text-color-ink">
        {{ $t('pages.home.newsletter.eyebrow', { title }) }}
      </p>
      <h2
        class="font-serif text-4xl leading-none text-color-ink md:text-[51px]"
      >
        {{ $t('pages.home.newsletter.heading') }}
      </h2>
      <p class="text-[13px] leading-[1.7] text-color-muted">
        {{ $t('pages.home.newsletter.description') }}
      </p>
    </div>

    <div class="flex flex-1 flex-col gap-[22px]">
      <p v-if="submitted" class="text-sm text-color-ink">
        {{ $t('pages.home.newsletter.success') }}
      </p>
      <UForm
        v-else
        v-slot="formSlot"
        :schema="schema"
        :state="state"
        class="flex flex-col gap-[22px]"
        @submit="onSubmit"
      >
        <div class="flex h-[50px] items-center gap-3 border-b border-color-ink">
          <UFormField name="email" class="flex-1" :ui="{ error: 'sr-only' }">
            <UInput
              v-model="state.email"
              type="email"
              variant="none"
              :placeholder="$t('pages.home.newsletter.emailPlaceholder')"
              :ui="{
                base: 'p-0 rounded-none text-sm text-color-ink placeholder:text-color-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ink)',
              }"
            />
          </UFormField>
          <button
            type="submit"
            class="flex shrink-0 items-center gap-2 text-[11px] font-medium text-color-ink"
          >
            {{ $t('pages.home.newsletter.submit') }}
            <UIcon name="i-lucide-arrow-right" class="size-[21px]" />
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
          <p class="text-[11px] text-color-muted">
            {{ $t('pages.home.newsletter.interestedLabel') }}
          </p>
          <label class="flex items-center gap-2 text-[11px] text-color-ink">
            <input
              v-model="interestedWomen"
              type="checkbox"
              class="size-[13px] border-color-muted"
            />
            {{ $t('pages.home.newsletter.interestWomen') }}
          </label>
          <label class="flex items-center gap-2 text-[11px] text-color-ink">
            <input
              v-model="interestedMen"
              type="checkbox"
              class="size-[13px] border-color-muted"
            />
            {{ $t('pages.home.newsletter.interestMen') }}
          </label>
        </div>

        <UFormField name="consent" :ui="{ error: 'sr-only' }">
          <label
            class="flex items-start gap-2.5 text-[10px] leading-[1.7] text-color-muted"
          >
            <input
              v-model="state.consent"
              type="checkbox"
              class="mt-0.5 size-[13px] shrink-0 border-color-muted"
            />
            <span>
              {{ $t('pages.home.newsletter.consentPrefix', { title }) }}
              <AppLink to="/store" class="underline">{{
                $t('pages.home.newsletter.privacyPolicy')
              }}</AppLink>
              {{ $t('pages.home.newsletter.consentSuffix') }}
            </span>
          </label>
        </UFormField>

        <AppFormError
          :show="!!formSlot?.errors?.length"
          :message="formSlot?.errors?.[0]?.message"
        />
      </UForm>
    </div>
  </section>
</template>
