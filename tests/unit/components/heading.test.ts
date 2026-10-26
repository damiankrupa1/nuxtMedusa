import { describe, expect, it } from '@jest/globals'
import { mount } from '@vue/test-utils'

import Heading from '~/components/app/heading.vue'

describe('heading component', () => {
  it('renders the requested semantic heading tag', () => {
    const wrapper = mount(Heading, {
      props: {
        as: 'h2',
      },
      slots: {
        default: 'Featured products',
      },
    })

    expect(wrapper.element.tagName).toBe('H2')
    expect(wrapper.text()).toContain('Featured products')
  })

  it('keeps the functional sans title look by default', () => {
    const wrapper = mount(Heading, { props: { as: 'h1' } })

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['text-3xl', 'font-medium']),
    )
    expect(wrapper.classes()).not.toContain('font-serif')
  })

  it('picks the smaller title size through the size prop', () => {
    const wrapper = mount(Heading, { props: { as: 'h1', size: 'sm' } })

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['text-lg', 'font-medium']),
    )
    expect(wrapper.classes()).not.toContain('text-3xl')
  })

  it('falls back to md for a size the variant does not have', () => {
    const title = mount(Heading, { props: { as: 'h2', size: 'hero' } })
    const display = mount(Heading, {
      props: { as: 'h2', variant: 'display', size: 'sm' },
    })

    expect(title.classes()).toContain('text-3xl')
    expect(display.classes()).toContain('md:text-[48px]')
  })

  it('renders the serif display look at the requested size', () => {
    const wrapper = mount(Heading, {
      props: { as: 'h2', variant: 'display', size: 'lg' },
    })

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining([
        'font-serif',
        'md:text-[56px]',
        'text-color-ink',
      ]),
    )
    expect(wrapper.classes()).not.toContain('text-3xl')
  })

  it('switches a display heading to the light text color on a dark section', () => {
    const wrapper = mount(Heading, {
      props: { as: 'h2', variant: 'display', tone: 'dark' },
    })

    expect(wrapper.classes()).toContain('text-color-paper')
    expect(wrapper.classes()).not.toContain('text-color-ink')
  })
})
