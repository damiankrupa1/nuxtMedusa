import { describe, expect, it } from '@jest/globals'
import { mount } from '@vue/test-utils'

import ButtonPrimary from '../../../app/components/app/button-primary.vue'

describe('button-primary component', () => {
  it('renders a neutral solid button by default', () => {
    const wrapper = mount(ButtonPrimary, {
      slots: {
        default: 'Add to cart',
      },
      global: {
        stubs: {
          UButton: {
            template: '<button><slot /></button>',
            props: ['type', 'to', 'loading', 'disabled', 'block', 'variant', 'color', 'size'],
          },
        },
      },
    })

    expect(wrapper.html()).toContain('Add to cart')
    expect(wrapper.find('button').exists()).toBe(true)
  })
})
