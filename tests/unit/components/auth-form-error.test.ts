import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'

import AppStatusMessage from '~/components/app/status-message.vue'
import RegisterForm from '~/components/auth/register-form.vue'
import SigninForm from '~/components/auth/signin-form.vue'

const apiError = ref<string | null>(null)
const mutate = vi.fn<() => Promise<void>>()
const mockCustomerMutation = () => ({
  mutate,
  loading: ref(false),
  error: apiError,
})

vi.mock('~/composables/customer', () => ({
  useLoginCustomer: () => mockCustomerMutation(),
  useRegisterCustomer: () => mockCustomerMutation(),
}))

Object.assign(globalThis, {
  useI18n: () => ({ t: (key: string) => key }),
  useRegisterCustomer: () => mockCustomerMutation(),
  refreshNuxtData: vi.fn(async () => {}),
})

const stubs = {
  AuthFormHeader: true,
  AppInput: true,
  AppInputPassword: true,
  AppLink: true,
  UFormField: { template: '<div><slot /></div>' },
  UForm: {
    emits: ['submit'],
    template: '<form @submit.prevent="$emit(\'submit\', {})"><slot /></form>',
  },
  AppButtonPrimary: { template: '<button type="submit"><slot /></button>' },
  UAlert: {
    props: ['title'],
    template: '<div class="u-alert">{{ title }}</div>',
  },
}

describe.each([
  ['sign-in', SigninForm, 'auth.signin.genericError'],
  ['register', RegisterForm, 'auth.register.genericError'],
])('%s form error', (_name, component, genericError) => {
  const mountForm = () =>
    mount(component, {
      global: {
        stubs,
        components: { AppStatusMessage },
        mocks: { $t: (key: string) => key },
      },
    })

  beforeEach(() => {
    apiError.value = null
    mutate.mockReset()
  })

  it('keeps an empty live region mounted before any submit', () => {
    const wrapper = mountForm()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.find('.u-alert').exists()).toBe(false)
  })

  it('announces the API error message', async () => {
    mutate.mockImplementation(async () => {
      apiError.value = 'Invalid email or password'
      throw new Error('401')
    })
    const wrapper = mountForm()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="alert"] .u-alert').text()).toBe(
      'Invalid email or password',
    )
  })

  it('falls back to a generic error when the API gave no message', async () => {
    mutate.mockRejectedValue(new Error('network'))
    const wrapper = mountForm()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="alert"] .u-alert').text()).toBe(genericError)
  })
})
