import { describe, expect, it } from '@jest/globals'
import { mount } from '@vue/test-utils'

import StatusMessage from '~/components/app/status-message.vue'

const stubs = {
  UAlert: {
    template:
      '<div class="u-alert" :data-color="color" :data-icon="icon">{{ title }}</div>',
    props: ['color', 'icon', 'title', 'description', 'variant'],
  },
}

const mountMessage = (props: Record<string, unknown>, attrs = {}) =>
  mount(StatusMessage, {
    props,
    attrs,
    global: { stubs },
    attachTo: document.body,
  })

describe('status message component', () => {
  it('announces errors assertively and other messages politely', () => {
    expect(mountMessage({ type: 'error' }).attributes('role')).toBe('alert')
    expect(mountMessage({ type: 'success' }).attributes('role')).toBe('status')
  })

  it('keeps the live region mounted but empty while there is no message', () => {
    const wrapper = mountMessage({ type: 'success', message: null })

    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.find('.u-alert').exists()).toBe(false)
  })

  it('shows the message in an alert matching its type', () => {
    const wrapper = mountMessage({
      type: 'success',
      message: 'Thanks for signing up',
    })

    const alert = wrapper.find('.u-alert')
    expect(alert.text()).toBe('Thanks for signing up')
    expect(alert.attributes('data-color')).toBe('success')
    expect(alert.attributes('data-icon')).toBe('i-lucide-circle-check')
  })

  it('puts the caller class on the visible alert, not on the live region', () => {
    const wrapper = mountMessage(
      { type: 'error', message: 'Invalid email' },
      { class: 'mt-[22px]' },
    )

    expect(wrapper.classes()).not.toContain('mt-[22px]')
    expect(wrapper.find('.u-alert').classes()).toContain('mt-[22px]')
  })

  it('can take focus, so it can replace a removed form', () => {
    const wrapper = mountMessage({ type: 'success', message: 'Done' })

    ;(wrapper.vm as unknown as { focus: () => void }).focus()

    expect(document.activeElement).toBe(wrapper.element)
    wrapper.unmount()
  })
})
