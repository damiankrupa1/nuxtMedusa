import { describe, expect, it } from '@jest/globals'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

import LinkButton from '~/components/app/link-button.vue'

Object.assign(globalThis, {
  useCountry: () => ({ country: ref({ iso_2: 'pl' }) }),
})

const UButton = {
  props: ['to', 'trailingIcon', 'variant', 'color'],
  template:
    '<a :href="to" :data-trailing-icon="trailingIcon" :data-color="color"><slot /></a>',
}

const mountLink = (props: Record<string, unknown>) =>
  mount(LinkButton, {
    props,
    slots: { default: 'View all' },
    global: { stubs: { UButton } },
  })

describe('link-button component', () => {
  it('links to the path in the current country', () => {
    expect(mountLink({ to: '/store' }).attributes('href')).toBe('/pl/store')
  })

  it('prefers an explicit country code', () => {
    expect(
      mountLink({ to: '/store', countryCode: 'de' }).attributes('href'),
    ).toBe('/de/store')
  })

  it('renders the underlined ink "text ↗" look', () => {
    const wrapper = mountLink({ to: '/store' })

    expect(wrapper.text()).toBe('View all')
    expect(wrapper.attributes('data-color')).toBe('neutral')
    expect(wrapper.attributes('data-trailing-icon')).toBe(
      'i-lucide-arrow-up-right',
    )
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining([
        'border-b',
        'border-color-ink',
        'text-[13px]',
        'text-color-ink',
      ]),
    )
  })
})
