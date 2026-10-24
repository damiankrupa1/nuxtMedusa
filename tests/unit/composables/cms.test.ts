import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { ref } from 'vue'

import { cmsRepository } from '../../../app/repository/cms.repository'
import {
  useFetchFooterContent,
  useFetchNavigation,
} from '../../../app/composables/cms'
import type { CmsFooterContent, CmsNavigation } from '../../../app/types/cms'

jest.mock('../../../app/repository/cms.repository', () => ({
  cmsRepository: jest.fn(),
}))

describe('cms composables', () => {
  const fetchNavigation =
    jest.fn<(locale: string) => Promise<CmsNavigation | null>>()
  const fetchFooterContent =
    jest.fn<(locale: string) => Promise<CmsFooterContent | null>>()
  const useLazyAsyncData = jest.fn(
    (key: string, handler: () => Promise<unknown>) => ({ key, handler }),
  )
  const locale = ref('pl')

  Object.assign(globalThis, {
    useI18n: () => ({ locale }),
    useLazyAsyncData,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    locale.value = 'pl'
    jest.mocked(cmsRepository).mockReturnValue({
      fetchNavigation,
      fetchFooterContent,
    })
  })

  it('keys the navigation fetch by locale and delegates to the repository', async () => {
    fetchNavigation.mockResolvedValue({ primaryNav: [] })

    useFetchNavigation()

    expect(useLazyAsyncData).toHaveBeenCalledWith(
      'cms:navigation:pl',
      expect.any(Function),
    )

    const handler = useLazyAsyncData.mock.calls[0]![1]
    await handler()
    expect(fetchNavigation).toHaveBeenCalledWith('pl')
  })

  it('keys the footer content fetch by locale and delegates to the repository', async () => {
    fetchFooterContent.mockResolvedValue({
      helpLinks: [],
      worldLinks: [],
      legalLinks: [],
      contact: { email: '', phone: '', hours: '' },
      social: { handle: '' },
    })

    useFetchFooterContent()

    expect(useLazyAsyncData).toHaveBeenCalledWith(
      'cms:footer:pl',
      expect.any(Function),
    )

    const handler = useLazyAsyncData.mock.calls[0]![1]
    await handler()
    expect(fetchFooterContent).toHaveBeenCalledWith('pl')
  })
})
