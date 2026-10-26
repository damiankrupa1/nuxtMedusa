import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { nextTick, ref } from 'vue'

import { useNotFoundWhenMissing } from '~/composables/not-found'

type Status = 'idle' | 'pending' | 'success' | 'error'

describe('useNotFoundWhenMissing', () => {
  const showError = jest.fn()
  Object.assign(globalThis, { showError })

  beforeEach(() => {
    showError.mockClear()
  })

  it('answers 404 when the fetch found nothing', () => {
    useNotFoundWhenMissing(
      ref(null),
      ref<Status>('success'),
      'Product not found',
    )

    expect(showError).toHaveBeenCalledWith({
      statusCode: 404,
      statusMessage: 'Product not found',
    })
  })

  it('waits for lazy data before deciding', async () => {
    const data = ref<object | null>()
    const status = ref<Status>('pending')
    useNotFoundWhenMissing(data, status, 'Product not found')
    expect(showError).not.toHaveBeenCalled()

    data.value = null
    status.value = 'success'
    await nextTick()

    expect(showError).toHaveBeenCalledTimes(1)
  })

  it('leaves found items and failed requests alone', () => {
    useNotFoundWhenMissing(
      ref({ id: 'prod_1' }),
      ref<Status>('success'),
      'Product not found',
    )
    useNotFoundWhenMissing(ref(null), ref<Status>('error'), 'Product not found')

    expect(showError).not.toHaveBeenCalled()
  })
})
