import { describe, expect, it } from '@jest/globals'
import { mount } from '@vue/test-utils'

import FormError from '../../../app/components/app/form-error.vue'

describe('form-error component', () => {
  const stubs = {
    UAlert: {
      template: '<div class="u-alert">{{ title }}</div>',
      props: ['title', 'color', 'variant', 'size', 'ui', 'icon'],
    },
  }

  it('renders the message when show is true', () => {
    const wrapper = mount(FormError, {
      props: { show: true, message: 'Email is required' },
      global: { stubs },
    })

    expect(wrapper.text()).toContain('Email is required')
  })

  it('renders nothing when show is false', () => {
    const wrapper = mount(FormError, {
      props: { show: false, message: 'Email is required' },
      global: { stubs },
    })

    expect(wrapper.find('.u-alert').exists()).toBe(false)
  })

  it('renders nothing when there is no message', () => {
    const wrapper = mount(FormError, {
      props: { show: true },
      global: { stubs },
    })

    expect(wrapper.find('.u-alert').exists()).toBe(false)
  })
})
