import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import Heading from '~/components/app/heading.vue'
import SectionIntro from '~/components/app/section-intro.vue'

const mountIntro = (
  props: Record<string, unknown> = {},
  slots: Record<string, string> = {},
) =>
  mount(SectionIntro, {
    props: { eyebrow: 'LETTERS FROM FASHION', ...props },
    slots,
    global: { components: { AppHeading: Heading } },
  })

describe('section intro component', () => {
  it('renders the eyebrow and a serif h2 heading by default', () => {
    const wrapper = mountIntro({ heading: 'Good style stays in touch.' })

    const heading = wrapper.find('h2')
    expect(wrapper.text()).toContain('LETTERS FROM FASHION')
    expect(heading.text()).toBe('Good style stays in touch.')
    expect(heading.classes()).toContain('font-serif')
  })

  it('renders only the eyebrow when there is no heading', () => {
    const wrapper = mountIntro()

    expect(wrapper.text()).toBe('LETTERS FROM FASHION')
    expect(wrapper.find('h2').exists()).toBe(false)
  })

  it('takes heading markup through the heading slot', () => {
    const wrapper = mountIntro(
      { as: 'h1', size: 'lg' },
      {
        heading:
          '<span class="block">Made slowly,</span><span class="block">worn long.</span>',
      },
    )

    const heading = wrapper.find('h1')
    expect(heading.findAll('span.block')).toHaveLength(2)
    expect(heading.classes()).toContain('md:text-[56px]')
  })

  it('renders the lead paragraph only when one is passed', () => {
    const withoutLead = mountIntro({ heading: 'Heading' })
    const withLead = mountIntro(
      { heading: 'Heading' },
      { default: 'Get 10% off your first order.' },
    )

    expect(withoutLead.findAll('p')).toHaveLength(1)
    expect(withLead.findAll('p')).toHaveLength(2)
    expect(withLead.text()).toContain('Get 10% off your first order.')
  })

  it('uses the dark-section colors for every text part', () => {
    const wrapper = mountIntro(
      { heading: 'Heading', tone: 'dark' },
      { default: 'Lead' },
    )

    const [eyebrow, lead] = wrapper.findAll('p')
    expect(eyebrow?.classes()).toContain('text-color-sage')
    expect(lead?.classes()).toContain('text-color-sage')
    expect(wrapper.find('h2').classes()).toContain('text-color-paper')
  })
})
