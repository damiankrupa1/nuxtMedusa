import { describe, expect, it } from '@jest/globals'
import { mount } from '@vue/test-utils'

import Heading from '../../../app/components/app/heading.vue'

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
})
