import { describe, expect, it } from '@jest/globals'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

import ButtonPrimary from '~/components/app/button-primary.vue'

Object.assign(globalThis, {
  useCountry: () => ({ country: ref({ iso_2: 'pl' }) }),
})

const UButton = {
  props: ['type', 'to', 'loading', 'disabled', 'block', 'trailingIcon'],
  template:
    '<a v-if="to" :href="to" :data-trailing-icon="trailingIcon"><slot /></a><button v-else :type="type" :data-trailing-icon="trailingIcon"><slot /></button>',
}

const mountButton = (
  props: Record<string, unknown> = {},
  attrs: Record<string, unknown> = {},
) =>
  mount(ButtonPrimary, {
    props,
    attrs,
    slots: { default: 'Shop now' },
    global: { stubs: { UButton } },
  })

describe('button-primary component', () => {
  it('renders a button with the ink look by default', () => {
    const wrapper = mountButton()

    const button = wrapper.find('button')
    expect(button.text()).toBe('Shop now')
    expect(button.attributes('type')).toBe('button')
    expect(button.classes()).toEqual(
      expect.arrayContaining([
        'h-12',
        'text-xs',
        'font-medium',
        'bg-color-ink',
        'text-color-paper',
      ]),
    )
  })

  it('switches to paper background and ink text when inverted', () => {
    const wrapper = mountButton({ inverted: true })

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['bg-color-paper', 'text-color-ink']),
    )
    expect(wrapper.classes()).not.toContain('bg-color-ink')
  })

  it('links to the path in the current country', () => {
    const wrapper = mountButton({ to: '/store' })

    expect(wrapper.find('a').attributes('href')).toBe('/pl/store')
  })

  it('passes the trailing icon through', () => {
    const wrapper = mountButton({
      type: 'submit',
      trailingIcon: 'i-lucide-arrow-right',
    })

    const button = wrapper.find('button')
    expect(button.attributes('type')).toBe('submit')
    expect(button.attributes('data-trailing-icon')).toBe('i-lucide-arrow-right')
  })

  it('keeps a caller class for layout next to its own look', () => {
    const wrapper = mountButton({}, { class: 'mt-6' })

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['mt-6', 'bg-color-ink']),
    )
  })
})
