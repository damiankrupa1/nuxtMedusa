<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import type AppStatusMessage from '~/components/app/status-message.vue'
import {
  buildNewsletterSchema,
  createNewsletterForm,
  type NewsletterForm,
} from '~/types/newsletter'

const { title } = useAppConfig()
const { t } = useI18n()

const schema = computed(() => buildNewsletterSchema(t))

const state = reactive(createNewsletterForm())
const submitted = ref(false)
const successMessage = ref<InstanceType<typeof AppStatusMessage> | null>(null)

// No newsletter backend/composable exists in this codebase — see
// missing-medusa-api-data skill. Presentational only, no network call.
const onSubmit = async (_event: FormSubmitEvent<NewsletterForm>) => {
  submitted.value = true
  // The form, and the submit button that had focus, is gone now.
  await nextTick()
  successMessage.value?.focus()
}
</script>

<template>
  <section
    class="flex flex-col gap-10 bg-color-stone px-6 py-14 md:flex-row md:gap-[100px] md:px-24 md:py-[72px]"
  >
    <AppSectionIntro
      :eyebrow="$t('app.newsletter.eyebrow', { title })"
      :heading="$t('app.newsletter.heading')"
      class="md:w-[530px] md:shrink-0"
    >
      {{ $t('app.newsletter.description') }}
    </AppSectionIntro>

    <div class="flex-1">
      <AppStatusMessage
        ref="successMessage"
        type="success"
        :message="submitted ? $t('app.newsletter.success') : null"
      />
      <UForm
        v-if="!submitted"
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
          <UButton
            type="submit"
            variant="link"
            color="neutral"
            loading-auto
            trailing-icon="i-lucide-arrow-right"
            :label="$t('app.newsletter.submit')"
            :ui="{
              base: 'shrink-0 gap-2 p-0 text-[11px] text-color-ink hover:text-color-ink',
              trailingIcon: 'size-[21px]',
            }"
          />
        </div>

        <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
          <p class="text-[11px] text-color-muted">
            {{ $t('app.newsletter.interestedLabel') }}
          </p>
          <UCheckbox
            v-model="state.interests.women"
            size="xs"
            :label="$t('app.newsletter.interestWomen')"
            :ui="{ label: 'font-normal text-[11px] text-color-ink' }"
          />
          <UCheckbox
            v-model="state.interests.men"
            size="xs"
            :label="$t('app.newsletter.interestMen')"
            :ui="{ label: 'font-normal text-[11px] text-color-ink' }"
          />
        </div>

        <div>
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
          <AppStatusMessage
            type="error"
            class="mt-[22px]"
            :message="formSlot?.errors?.[0]?.message ?? null"
          />
        </div>
      </UForm>
    </div>
  </section>
</template>
