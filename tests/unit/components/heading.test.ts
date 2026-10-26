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
