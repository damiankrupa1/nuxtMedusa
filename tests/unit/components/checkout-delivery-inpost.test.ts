import { describe, expect, it } from '@jest/globals'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import CheckoutDeliveryInpost from '../../../app/components/checkout/delivery/inpost/index.vue'
import type { InpostPoint } from '../../../app/utils/inpost'

describe('checkout delivery inpost component', () => {
  const PickerStub = {
    name: 'CheckoutDeliveryInpostPicker',
    template: '<div class="inpost-picker" />',
    emits: ['select'],
  }
  const stubs = {
    UButton: { template: '<button><slot /></button>' },
    UModal: {
      template: '<div v-if="open" class="u-modal"><slot name="body" /></div>',
      props: ['open', 'title', 'description', 'ui'],
    },
    CheckoutDeliveryInpostPicker: PickerStub,
  }
  const mocks = { $t: (key: string) => key }

  const point: InpostPoint = {
    name: 'KRA010',
    address_details: {
      street: 'Długa',
      building_number: '12',
      post_code: '30-001',
      city: 'Kraków',
    },
  }

  // Waits a tick so the picker opened on mount is rendered.
  const mountWith = async (modelValue: InpostPoint | null) => {
    const wrapper = mount(CheckoutDeliveryInpost, {
      props: {
        modelValue,
        'onUpdate:modelValue': (value: InpostPoint | null) =>
          wrapper.setProps({ modelValue: value }),
      },
      global: { stubs, mocks },
    })
    await nextTick()
    return wrapper
  }

  it('opens the picker as soon as it shows up without a point', async () => {
    const wrapper = await mountWith(null)

    expect(wrapper.find('.u-modal').exists()).toBe(true)
    expect(wrapper.text()).toContain('checkout.delivery.inpost.noPointSelected')
  })

  it('keeps the picker closed and shows the point when one is selected', async () => {
    const wrapper = await mountWith(point)

    expect(wrapper.find('.u-modal').exists()).toBe(false)
    expect(wrapper.text()).toContain('Długa 12, 30-001 Kraków')
  })

  it('stores the selected point and closes the picker', async () => {
    const wrapper = await mountWith(null)

    wrapper.findComponent(PickerStub).vm.$emit('select', point)
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([point])
    expect(wrapper.find('.u-modal').exists()).toBe(false)
  })

  it('reopens the picker to change the point', async () => {
    const wrapper = await mountWith(point)

    await wrapper.find('button').trigger('click')

    expect(wrapper.find('.u-modal').exists()).toBe(true)
  })
})
