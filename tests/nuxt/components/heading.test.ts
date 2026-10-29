import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import Heading from '~/components/app/heading.vue'

describe('heading component in Nuxt', () => {
  it('renders the requested semantic heading tag', async () => {
    const wrapper = await mountSuspended(Heading, {
      props: { as: 'h2' },
      slots: { default: 'Featured products' },
    })

    expect(wrapper.element.tagName).toBe('H2')
    expect(wrapper.text()).toContain('Featured products')
  })

  it('keeps the functional sans title look by default', async () => {
    const wrapper = await mountSuspended(Heading, { props: { as: 'h1' } })

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['text-3xl', 'font-medium']),
    )
    expect(wrapper.classes()).not.toContain('font-serif')
  })

  it('picks the smaller title size through the size prop', async () => {
    const wrapper = await mountSuspended(Heading, {
      props: { as: 'h1', size: 'sm' },
    })

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['text-lg', 'font-medium']),
    )
    expect(wrapper.classes()).not.toContain('text-3xl')
  })

  it('falls back to md for a size the variant does not have', async () => {
    const title = await mountSuspended(Heading, {
      props: { as: 'h2', size: 'hero' },
    })
    const display = await mountSuspended(Heading, {
      props: { as: 'h2', variant: 'display', size: 'sm' },
    })

    expect(title.classes()).toContain('text-3xl')
    expect(display.classes()).toContain('md:text-[48px]')
  })

  it('renders the serif display look and switches to light tone', async () => {
    const wrapper = await mountSuspended(Heading, {
      props: { as: 'h2', variant: 'display', size: 'lg', tone: 'dark' },
    })

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining([
        'font-serif',
        'md:text-[56px]',
        'text-color-paper',
      ]),
    )
    expect(wrapper.classes()).not.toContain('text-color-ink')
  })
})
