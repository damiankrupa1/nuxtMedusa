<script lang="ts" setup>
import type { FormSubmitEvent } from '#ui/types'
import {
  buildSigninSchema,
  type LoginCustomerData,
  type SigninForm,
} from '~/types/customer'
import { useLoginCustomer } from '~/composables/customer'

const emit = defineEmits<{
  'switch-to-register': []
}>()

const {
  mutate: login,
  loading: isLoggingIn,
  error: apiError,
} = useLoginCustomer()

const { t } = useI18n()

const formSchema = computed(() => buildSigninSchema(t))

const form = ref<SigninForm>({
  email: '',
  password: '',
})

const formError = ref<string | undefined>(undefined)

const onSubmit = async (_event: FormSubmitEvent<SigninForm>) => {
  formError.value = undefined

  try {
    const loginData: LoginCustomerData = {
      email: form.value.email,
      password: form.value.password,
    }

    await login(loginData)
    await refreshNuxtData('customer')
  } catch {
    if (!apiError.value) {
      formError.value = t('auth.signin.genericError')
    }
  }
}

const displayError = computed(() => apiError.value || formError.value)

const switchToRegister = () => {
  emit('switch-to-register')
}
</script>

<template>
  <div class="w-full max-w-sm mx-auto">
    <AuthFormHeader
      :title="$t('auth.signin.title')"
      :description="$t('auth.signin.description')"
    />

    <AppFormError :message="displayError" :show="!!displayError" class="mb-4" />

    <UForm
      :schema="formSchema"
      :state="form"
      class="space-y-2"
      @submit="onSubmit"
    >
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
        name="password"
        required
        size="xl"
        class="w-full"
        :ui="{ error: 'text-xs' }"
      >
        <AppInputPassword
          v-model="form.password"
          name="password"
          autocomplete="current-password"
          required
          :label="$t('auth.fields.password')"
          size="xl"
        />
      </UFormField>

      <AppButtonPrimary type="submit" block :loading="isLoggingIn" class="mt-6">
        {{ $t('auth.signin.submit') }}
      </AppButtonPrimary>
    </UForm>

    <div class="mt-6 text-center text-xs">
      <p>
        {{ $t('auth.signin.notMember') }}
        <span class="underline cursor-pointer" @click="switchToRegister">
          {{ $t('auth.signin.joinUs') }}
        </span>
      </p>
    </div>
  </div>
</template>
