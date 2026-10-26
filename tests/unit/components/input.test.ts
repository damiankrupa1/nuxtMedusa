import { describe, expect, it } from '@jest/globals'
import { mount } from '@vue/test-utils'
import { defineComponent, h, provide, ref } from 'vue'

import AppInput from '~/components/app/input/index.vue'

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

describe('input component', () => {
  const stubs = {
    UInput: {
      // Like UInput, passes extra attributes (aria-required) to the <input>.
      inheritAttrs: false,
      template: '<input v-bind="$attrs" :id="id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /><slot />',
      props: ['id', 'modelValue', 'placeholder', 'type', 'name', 'autocomplete', 'size', 'ui'],
    },
  }

  it('renders the label and marks required fields', () => {
    const wrapper = mount(AppInput, {
      props: { modelValue: '', name: 'email', label: 'Email', required: true },
      global: { stubs },
    })

    expect(wrapper.text()).toContain('Email')
    expect(wrapper.text()).toContain('*')
  })

  it('tells assistive tech the field is required instead of reading the asterisk', () => {
    const wrapper = mount(AppInput, {
      props: { modelValue: '', name: 'email', label: 'Email', required: true },
      global: { stubs },
    })

    expect(wrapper.find('input').attributes('aria-required')).toBe('true')
    expect(wrapper.find('[aria-hidden="true"]').text()).toBe('*')
  })

  it('does not render an asterisk when not required', () => {
    const wrapper = mount(AppInput, {
      props: { modelValue: '', name: 'email', label: 'Email' },
      global: { stubs },
    })

    expect(wrapper.text()).not.toContain('*')
    expect(wrapper.find('input').attributes('aria-required')).toBeUndefined()
  })

  it('emits update:modelValue when the input changes', async () => {
    const wrapper = mount(AppInput, {
      props: { modelValue: '', name: 'email', label: 'Email' },
      global: { stubs },
    })

    await wrapper.find('input').setValue('test@example.com')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['test@example.com'])
  })

  it('names the input with its label outside a form field', () => {
    const wrapper = mount(AppInput, {
      props: { modelValue: '', name: 'email', label: 'Email' },
      global: { stubs },
    })

    const id = wrapper.find('input').attributes('id')
    expect(id).toBeTruthy()
    expect(wrapper.find('label').attributes('for')).toBe(id)
  })

  it('reuses the form field input id, so the field keeps its wiring', () => {
    const wrapper = mount(FormFieldStub, {
      slots: { default: () => h(AppInput, { modelValue: '', name: 'email', label: 'Email' }) },
      global: { stubs },
    })

    expect(wrapper.find('input').attributes('id')).toBe('field-input-id')
    expect(wrapper.find('label').attributes('for')).toBe('field-input-id')
  })
})
