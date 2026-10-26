<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import { buildNewsletterSchema, type NewsletterForm } from '~/types/newsletter'

const { title } = useAppConfig()
const { t } = useI18n()

const schema = computed(() => buildNewsletterSchema(t))

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
        {{ $t('app.newsletter.eyebrow', { title }) }}
      </p>
      <h2
        class="font-serif text-4xl leading-none text-color-ink md:text-[51px]"
      >
        {{ $t('app.newsletter.heading') }}
      </h2>
      <p class="text-[13px] leading-[1.7] text-color-muted">
        {{ $t('app.newsletter.description') }}
      </p>
    </div>

    <div class="flex flex-1 flex-col gap-[22px]">
      <p v-if="submitted" class="text-sm text-color-ink">
        {{ $t('app.newsletter.success') }}
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
              :placeholder="$t('app.newsletter.emailPlaceholder')"
              :ui="{
                base: 'p-0 rounded-none text-sm text-color-ink placeholder:text-color-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ink)',
              }"
            />
          </UFormField>
          <button
            type="submit"
            class="flex shrink-0 items-center gap-2 text-[11px] font-medium text-color-ink"
          >
            {{ $t('app.newsletter.submit') }}
            <UIcon name="i-lucide-arrow-right" class="size-[21px]" />
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
          <p class="text-[11px] text-color-muted">
            {{ $t('app.newsletter.interestedLabel') }}
          </p>
          <UCheckbox
            v-model="interestedWomen"
            size="xs"
            :label="$t('app.newsletter.interestWomen')"
            :ui="{ label: 'font-normal text-[11px] text-color-ink' }"
          />
          <UCheckbox
            v-model="interestedMen"
            size="xs"
            :label="$t('app.newsletter.interestMen')"
            :ui="{ label: 'font-normal text-[11px] text-color-ink' }"
          />
        </div>

        <UFormField name="consent" :ui="{ error: 'sr-only' }">
          <UCheckbox
            v-model="state.consent"
            size="xs"
            :ui="{
              wrapper: 'ms-2.5',
              label: 'font-normal text-[10px] leading-[1.7] text-color-muted',
            }"
          >
            <template #label>
              {{ $t('app.newsletter.consentPrefix', { title }) }}
              <AppLink to="/store" class="underline">{{
                $t('app.newsletter.privacyPolicy')
              }}</AppLink>
              {{ $t('app.newsletter.consentSuffix') }}
            </template>
          </UCheckbox>
        </UFormField>

        <AppFormError
          :show="!!formSlot?.errors?.length"
          :message="formSlot?.errors?.[0]?.message"
        />
      </UForm>
    </div>
  </section>
</template>
