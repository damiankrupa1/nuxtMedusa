import { describe, expect, it } from '@jest/globals'
import { mount } from '@vue/test-utils'

import InputPassword from '../../../app/components/app/input/password.vue'

describe('input password component', () => {
  const stubs = {
    UInput: {
      template: '<input :type="type" :value="modelValue" /><slot />',
      props: ['modelValue', 'type', 'placeholder', 'name', 'autocomplete', 'size', 'ui'],
    },
    UIcon: {
      template: '<i :data-icon="name" />',
      props: ['name'],
    },
  }

  it('masks the value as a password by default', () => {
    const wrapper = mount(InputPassword, {
      props: { modelValue: '', name: 'password', label: 'Password' },
      global: { stubs },
    })

    expect(wrapper.find('input').attributes('type')).toBe('password')
  })

  it('reveals the value as text after toggling visibility', async () => {
    const wrapper = mount(InputPassword, {
      props: { modelValue: '', name: 'password', label: 'Password' },
      global: { stubs },
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.find('input').attributes('type')).toBe('text')
  })
})
