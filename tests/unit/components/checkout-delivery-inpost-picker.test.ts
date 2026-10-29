import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import AppStatusMessage from '~/components/app/status-message.vue'
import CheckoutDeliveryInpostPicker from '~/components/checkout/delivery/inpost/picker.vue'

describe('checkout delivery inpost picker component', () => {
  let token = 'geowidget-token'

  Object.assign(globalThis, {
    useHead: () => {},
    useRuntimeConfig: () => ({ public: { inpostGeowidgetToken: token } }),
    useI18n: () => ({ t: (key: string) => key, locale: { value: 'pl' } }),
  })

  const stubs = {
    UAlert: {
      props: ['title'],
      template: '<div class="u-alert">{{ title }}</div>',
    },
    UIcon: { template: '<span class="u-icon" />' },
  }

  const mountPicker = () =>
    mount(CheckoutDeliveryInpostPicker, {
      global: { stubs, components: { AppStatusMessage } },
    })

  const geowidgetScript = () =>
    document.head.querySelector<HTMLScriptElement>(
      'script[src="https://geowidget.inpost.pl/inpost-geowidget.js"]',
    )

  beforeEach(() => {
    token = 'geowidget-token'
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    geowidgetScript()?.remove()
  })

  it('shows the map with an empty live region while the widget loads', () => {
    const wrapper = mountPicker()

    expect(wrapper.find('.inpost-map').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.find('.u-alert').exists()).toBe(false)
  })

  it('announces a failed widget load in the region it already had', async () => {
    const wrapper = mountPicker()
    const region = wrapper.find('[role="alert"]').element

    geowidgetScript()?.dispatchEvent(new Event('error'))
    await flushPromises()

    expect(wrapper.find('[role="alert"]').element).toBe(region)
    expect(wrapper.find('[role="alert"] .u-alert').text()).toBe(
      'checkout.delivery.inpost.loadFailed',
    )
    expect(wrapper.find('.inpost-map').exists()).toBe(false)
  })

  it('shows an error instead of the map without a geowidget token', async () => {
    token = ''
    const wrapper = mountPicker()
    await flushPromises()

    expect(wrapper.find('[role="alert"] .u-alert').text()).toBe(
      'checkout.delivery.inpost.missingToken',
    )
    expect(wrapper.find('.inpost-map').exists()).toBe(false)
  })
})
