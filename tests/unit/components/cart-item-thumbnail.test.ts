import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import CartItemThumbnail from '~/components/cart/item/thumbnail.vue'

// A line item of a product without images has no thumbnail (the e2e seed has
// none, on purpose); the cart must not render an <img> with src="undefined",
// which the browser requests as a page.
describe('cart item thumbnail component', () => {
  const stubs = {
    AppLink: { template: '<a><slot /></a>' },
    NuxtImg: {
      template: '<img :src="src" :alt="alt" />',
      props: ['src', 'alt'],
    },
  }

  it('shows the thumbnail when there is one', () => {
    const wrapper = mount(CartItemThumbnail, {
      props: { src: 'https://cdn.example/coat.jpg', alt: 'Wool coat' },
      global: { stubs },
    })

    const image = wrapper.get('img')
    expect(image.attributes('src')).toBe('https://cdn.example/coat.jpg')
    expect(image.attributes('alt')).toBe('Wool coat')
  })

  it('renders a named placeholder instead of an image without a thumbnail', () => {
    const wrapper = mount(CartItemThumbnail, {
      props: { alt: 'Wool coat' },
      global: { stubs },
    })

    expect(wrapper.find('img').exists()).toBe(false)
    const placeholder = wrapper.get('[role="img"]')
    expect(placeholder.attributes('aria-label')).toBe('Wool coat')
  })
})
