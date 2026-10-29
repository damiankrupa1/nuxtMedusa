import { describe, expect, it } from 'vitest'

import ButtonPrimary from '~/components/app/button-primary.vue'
import { mountWithCountry } from '~~/tests/nuxt/components/mount-with-country'

describe('button-primary component in Nuxt', () => {
  it('renders a real Nuxt UI button with its default look', async () => {
    const wrapper = await mountWithCountry(ButtonPrimary, {}, 'Shop now')
    const button = wrapper.get('button')

    expect(button.text()).toBe('Shop now')
    expect(button.attributes('type')).toBe('button')
    expect(button.classes()).toEqual(
      expect.arrayContaining(['h-12', 'bg-color-ink', 'text-color-paper']),
    )
  })

  it('switches to the inverted look', async () => {
    const wrapper = await mountWithCountry(
      ButtonPrimary,
      { inverted: true },
      'Shop now',
    )
    const button = wrapper.get('button')

    expect(button.classes()).toEqual(
      expect.arrayContaining(['bg-color-paper', 'text-color-ink']),
    )
    expect(button.classes()).not.toContain('bg-color-ink')
  })

  it('links to the path in the current country', async () => {
    const wrapper = await mountWithCountry(
      ButtonPrimary,
      { to: '/store' },
      'Shop now',
    )

    expect(wrapper.get('a').attributes('href')).toBe('/pl/store')
  })

  it('passes button attributes and caller classes to Nuxt UI', async () => {
    const wrapper = await mountWithCountry(
      ButtonPrimary,
      { type: 'submit', trailingIcon: 'i-lucide:arrow-right' },
      'Shop now',
      { class: 'mt-6' },
    )
    const button = wrapper.get('button')

    expect(button.attributes('type')).toBe('submit')
    expect(button.classes()).toContain('mt-6')
    expect(button.html()).toContain('i-lucide:arrow-right')
  })
})
