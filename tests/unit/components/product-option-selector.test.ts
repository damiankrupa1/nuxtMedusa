import type { StoreProductOption } from '@medusajs/types'
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import OptionSelector from '~/components/product/option-selector.vue'
import { getSwatchColor, isColorOption } from '~/utils/color'
import { sortOptionValues } from '~/utils/product'

Object.assign(globalThis, { getSwatchColor, isColorOption, sortOptionValues })

const makeOption = (title: string, values: string[]) =>
  ({
    id: title.toLowerCase(),
    title,
    values: values.map((value) => ({ id: value, value })),
  }) as unknown as StoreProductOption

const mocks = {
  $t: (key: string, params?: { option: string }) =>
    params ? `${key}:${params.option}` : key,
}

const mountSelector = (props: {
  option: StoreProductOption
  current?: string
  unavailable?: string[]
}) => mount(OptionSelector, { props, global: { mocks } })

describe('product option selector', () => {
  it('lists sizes from small to large and marks the chosen one', () => {
    const wrapper = mountSelector({
      option: makeOption('Size', ['L', 'S', 'M']),
      current: 'M',
    })

    const buttons = wrapper.findAll('button')

    expect(buttons.map((b) => b.text())).toEqual(['S', 'M', 'L'])
    expect(buttons.map((b) => b.attributes('aria-pressed'))).toEqual([
      'false',
      'true',
      'false',
    ])
  })

  it('disables unavailable values and still lets the rest be chosen', async () => {
    const wrapper = mountSelector({
      option: makeOption('Size', ['S', 'M']),
      unavailable: ['S'],
    })
    const [small, medium] = wrapper.findAll('button')

    expect(small!.attributes('disabled')).toBeDefined()
    expect(medium!.attributes('disabled')).toBeUndefined()

    await medium!.trigger('click')

    expect(wrapper.emitted('select:option')).toEqual([
      [{ optionId: 'size', value: 'M' }],
    ])
  })

  it('renders a color option as named swatches with the chosen color in the label', () => {
    const wrapper = mountSelector({
      option: makeOption('Color', ['Ecru', 'Olive']),
      current: 'Ecru',
    })

    expect(wrapper.find('p').text()).toBe('Color: Ecru')
    expect(
      wrapper.findAll('button').map((b) => b.attributes('aria-label')),
    ).toEqual(['Ecru', 'Olive'])
    expect(wrapper.findAll('button span')).toHaveLength(2)
  })
})
