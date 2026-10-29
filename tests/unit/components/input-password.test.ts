import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, provide, ref } from 'vue'

import InputPassword from '~/components/app/input/password.vue'

// Mimics UFormField: provides its input id under Nuxt UI's injection key.
const FormFieldStub = defineComponent({
  setup(_, { slots }) {
    provide(
      (globalThis as unknown as { inputIdInjectionKey: symbol })
        .inputIdInjectionKey,
      ref('field-input-id'),
    )
    return () => slots.default?.()
  },
})

describe('input password component', () => {
  const stubs = {
    UInput: {
      inheritAttrs: false,
      template:
        '<input v-bind="$attrs" :id="id" :type="type" :value="modelValue" /><slot />',
      props: [
        'id',
        'modelValue',
        'type',
        'placeholder',
        'name',
        'autocomplete',
        'size',
        'ui',
      ],
    },
    UIcon: {
      template: '<i :data-icon="name" />',
      props: ['name'],
    },
    AppIconButton: {
      template: '<button type="button" />',
      props: ['icon', 'label', 'size'],
    },
  }
  const mocks = { $t: (key: string) => key }

  it('marks a required field for assistive tech, hiding the asterisk', () => {
    const wrapper = mount(InputPassword, {
      props: {
        modelValue: '',
        name: 'password',
        label: 'Password',
        required: true,
      },
      global: { stubs, mocks },
    })

    expect(wrapper.find('input').attributes('aria-required')).toBe('true')
    expect(wrapper.find('[aria-hidden="true"]').text()).toBe('*')
  })

  it('masks the value as a password by default', () => {
    const wrapper = mount(InputPassword, {
      props: { modelValue: '', name: 'password', label: 'Password' },
      global: { stubs, mocks },
    })

    expect(wrapper.find('input').attributes('type')).toBe('password')
  })

  it('reveals the value as text after toggling visibility', async () => {
    const wrapper = mount(InputPassword, {
      props: { modelValue: '', name: 'password', label: 'Password' },
      global: { stubs, mocks },
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.find('input').attributes('type')).toBe('text')
  })

  it('names the input with its label outside a form field', () => {
    const wrapper = mount(InputPassword, {
      props: { modelValue: '', name: 'password', label: 'Password' },
      global: { stubs, mocks },
    })

    const id = wrapper.find('input').attributes('id')
    expect(id).toBeTruthy()
    expect(wrapper.find('label').attributes('for')).toBe(id)
  })

  it('reuses the form field input id, so the field keeps its wiring', () => {
    const wrapper = mount(FormFieldStub, {
      slots: {
        default: () =>
          h(InputPassword, {
            modelValue: '',
            name: 'password',
            label: 'Password',
          }),
      },
      global: { stubs, mocks },
    })

    expect(wrapper.find('input').attributes('id')).toBe('field-input-id')
    expect(wrapper.find('label').attributes('for')).toBe('field-input-id')
  })
})
