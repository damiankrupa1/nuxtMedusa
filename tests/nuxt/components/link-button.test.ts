import { describe, expect, it } from 'vitest'

import LinkButton from '~/components/app/link-button.vue'
import { mountWithCountry } from '~~/tests/nuxt/components/mount-with-country'

describe('link-button component in Nuxt', () => {
  it('uses the current country for an internal link', async () => {
    const wrapper = await mountWithCountry(LinkButton, { to: '/store' }, 'View all')
    const link = wrapper.get('a')

    expect(link.attributes('href')).toBe('/pl/store')
    expect(link.text()).toBe('View all')
  })

  it('prefers an explicit country code', async () => {
    const wrapper = await mountWithCountry(
      LinkButton,
      { to: '/store', countryCode: 'de' },
      'View all',
    )

    expect(wrapper.get('a').attributes('href')).toBe('/de/store')
  })

  it('renders the real Nuxt UI link styling and icon', async () => {
    const wrapper = await mountWithCountry(
      LinkButton,
      { to: '/store' },
      'View all',
    )
    const link = wrapper.get('a')

    expect(link.classes()).toEqual(
      expect.arrayContaining([
        'border-b',
        'border-color-ink',
        'text-[13px]',
        'text-color-ink',
      ]),
    )
    expect(link.html()).toContain('i-lucide:arrow-up-right')
  })
})
