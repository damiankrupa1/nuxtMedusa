import { describe, expect, it } from '@jest/globals'
import { mount } from '@vue/test-utils'

import AppInput from '../../../app/components/app/input/index.vue'

describe('input component', () => {
  const stubs = {
    UInput: {
      // Like UInput, passes extra attributes (aria-required) to the <input>.
      inheritAttrs: false,
      template: '<input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /><slot />',
      props: ['modelValue', 'placeholder', 'type', 'name', 'autocomplete', 'size', 'ui'],
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
})
