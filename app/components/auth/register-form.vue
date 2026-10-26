<script lang="ts" setup>
import type { FormSubmitEvent } from '#ui/types'
import {
  buildRegisterSchema,
  type RegisterCustomerData,
  type RegisterForm,
} from '~/types/customer'

const emit = defineEmits<{
  'switch-to-signin': []
}>()

const {
  mutate: register,
  loading: isRegistering,
  error: apiError,
} = useRegisterCustomer()

const { t } = useI18n()

const formSchema = computed(() => buildRegisterSchema(t))

const form = ref<RegisterForm>({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
})

const formError = ref<string | null>(null)

const onSubmit = async (_event: FormSubmitEvent<RegisterForm>) => {
  formError.value = null

  try {
    const customerData: RegisterCustomerData = {
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      email: form.value.email,
      password: form.value.password,
      phone: form.value.phone || undefined,
    }

    await register(customerData)
    await refreshNuxtData('customer')
  } catch {
    if (!apiError.value) {
      formError.value = t('auth.register.genericError')
    }
  }
}

const displayError = computed(() => apiError.value || formError.value)

const switchToSignin = () => {
  emit('switch-to-signin')
}
</script>

<template>
  <div class="w-full max-w-sm mx-auto">
    <AuthFormHeader
      :title="$t('auth.register.title')"
      :description="$t('auth.register.description')"
    />

    <AppStatusMessage type="error" :message="displayError" class="mb-4" />

    <UForm
      :schema="formSchema"
      :state="form"
      class="space-y-2"
      @submit="onSubmit"
    >
      <UFormField
        name="first_name"
        required
        size="xl"
        class="w-full"
        :ui="{ error: 'text-xs' }"
      >
        <AppInput
          v-model="form.first_name"
          name="first_name"
          autocomplete="given-name"
          required
          :label="$t('auth.fields.firstName')"
          size="xl"
        />
      </UFormField>

      <UFormField
        name="last_name"
        required
        size="xl"
        class="w-full"
        :ui="{ error: 'text-xs' }"
      >
        <AppInput
          v-model="form.last_name"
          name="last_name"
          autocomplete="family-name"
          required
          :label="$t('auth.fields.lastName')"
          size="xl"
        />
      </UFormField>

      <UFormField
        name="email"
        required
        size="xl"
        class="w-full"
        :ui="{ error: 'text-xs' }"
      >
        <AppInput
          v-model="form.email"
          name="email"
          type="email"
          autocomplete="email"
          required
          :label="$t('auth.fields.email')"
          size="xl"
        />
      </UFormField>

      <UFormField
        name="phone"
        size="xl"
        class="w-full"
        :ui="{ error: 'text-xs' }"
      >
        <AppInput
          v-model="form.phone"
          name="phone"
          type="tel"
          autocomplete="tel"
          :label="$t('auth.fields.phone')"
          size="xl"
        />
      </UFormField>

      <UFormField
        name="password"
        required
        size="xl"
        class="w-full"
        :ui="{ error: 'text-xs' }"
      >
        <AppInputPassword
          v-model="form.password"
          name="password"
          autocomplete="new-password"
          required
          :label="$t('auth.fields.password')"
          size="xl"
        />
      </UFormField>

      <!-- TODO: link the documents once the store has privacy-policy and
           terms-of-use pages; there are none yet, so a link would only 404. -->
      <div class="text-xs py-6">
        {{ $t('auth.register.agreement') }}
        {{ $t('auth.register.privacyPolicy') }}
        {{ $t('auth.register.and') }}
        {{ $t('auth.register.termsOfUse') }}.
      </div>

      <AppButtonPrimary type="submit" block :loading="isRegistering">
        {{ $t('auth.register.submit') }}
      </AppButtonPrimary>
    </UForm>

    <div class="mt-6 text-center text-xs">
      <p>
        {{ $t('auth.register.alreadyMember') }}
        <span class="underline cursor-pointer" @click="switchToSignin">
          {{ $t('auth.signin.submit') }}
        </span>
      </p>
    </div>
  </div>
</template>
