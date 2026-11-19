import { defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import {
  clearNuxtData,
  useNuxtApp,
  useNuxtData,
  useRouter,
  useState,
} from 'nuxt/app'

import { useFetchNavigation } from '~/composables/cms'
import { usePreview } from '~/composables/preview'
import { cmsRepository } from '~/repository/cms.repository'
import { previewRepository } from '~/repository/preview.repository'
import type { CmsNavigation } from '~/types/cms'
import type { CmsPreviewRequest, PreviewState } from '~/types/preview'
import { PREVIEW_STORAGE_KEY } from '~/types/preview'
import { createPreviewUnauthorizedError } from '~/utils/preview'

vi.mock('~/repository/cms.repository', () => ({ cmsRepository: vi.fn() }))
vi.mock('~/repository/preview.repository', () => ({
  previewRepository: vi.fn(),
}))

const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl'
const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
const published: CmsNavigation = {
  primaryNav: [{ label: 'Published', url: '/store' }],
}
const draft: CmsNavigation = {
  primaryNav: [{ label: 'Draft', url: '/store' }],
}

const fetchNavigation =
  vi.fn<
    (
      locale: string,
      preview?: CmsPreviewRequest,
    ) => Promise<CmsNavigation | null>
  >()
const fetchSession =
  vi.fn<(token: string) => Promise<{ expiresAt: string } | null>>()

const previewState = () => useState<PreviewState>('preview')
const stored = () => sessionStorage.getItem(PREVIEW_STORAGE_KEY)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(cmsRepository).mockReturnValue({
    fetchNavigation,
  } as unknown as ReturnType<typeof cmsRepository>)
  vi.mocked(previewRepository).mockReturnValue({ fetchSession })
  clearNuxtData()
  previewState().value = { status: 'off' }
  sessionStorage.clear()
  useNuxtApp().$i18n.locale.value = 'pl'
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePreview in Nuxt', () => {
  it('is off until the plugin starts it, like the server render and the hydration', () => {
    const { state, isPreview, previewToken } = usePreview()

    expect(state.value).toEqual({ status: 'off' })
    expect(isPreview.value).toBe(false)
    expect(previewToken.value).toBeNull()
  })

  it('checks the token with the server, then starts the preview and keeps the token for reloads of this tab', async () => {
    fetchSession.mockResolvedValue({ expiresAt })
    const preview = usePreview()

    await preview.start(token)

    expect(fetchSession).toHaveBeenCalledWith(token)
    expect(preview.state.value).toEqual({ status: 'active', token, expiresAt })
    expect(preview.previewToken.value).toBe(token)
    expect(JSON.parse(stored() ?? 'null')).toEqual({ token, expiresAt })
  })

  it('shows a refused token as expired and forgets it', async () => {
    sessionStorage.setItem(
      PREVIEW_STORAGE_KEY,
      JSON.stringify({ token, expiresAt }),
    )
    fetchSession.mockResolvedValue(null)
    const preview = usePreview()

    await preview.start(token)

    expect(preview.state.value).toEqual({ status: 'expired' })
    expect(preview.isPreview.value).toBe(true)
    expect(preview.previewToken.value).toBeNull()
    expect(stored()).toBeNull()
  })

  it('shows a ?preview page without any token as expired, without asking the server', async () => {
    const preview = usePreview()

    await preview.start(null)

    expect(fetchSession).not.toHaveBeenCalled()
    expect(preview.state.value).toEqual({ status: 'expired' })
  })

  it('expires only an active preview', async () => {
    const preview = usePreview()

    preview.expire()
    expect(preview.state.value).toEqual({ status: 'off' })

    fetchSession.mockResolvedValue({ expiresAt })
    await preview.start(token)
    preview.expire()

    expect(preview.state.value).toEqual({ status: 'expired' })
    expect(stored()).toBeNull()
  })

  it('on exit drops the drafts, the state, the stored token and ?preview, and keeps the rest of the URL', async () => {
    fetchSession.mockResolvedValue({ expiresAt })
    const router = useRouter()
    // A stand-in for the current route; navigating for real would run the
    // region middleware and load a page
    const mutableRouter = router as unknown as { currentRoute: unknown }
    const originalRoute = router.currentRoute
    mutableRouter.currentRoute = {
      value: {
        path: '/pl/store',
        query: { preview: '1', page: '2' },
        hash: '',
      },
    }
    const replace = vi.spyOn(router, 'replace').mockResolvedValue(undefined)
    const { payload } = useNuxtApp()
    payload.data['cms:navigation:pl'] = published
    payload.data['cms:navigation:pl:preview'] = draft
    payload.data['cms:shop-the-look:pl:region:reg_pl:preview'] = draft

    try {
      const preview = usePreview()
      await preview.start(token)
      await preview.exit()

      expect(preview.state.value).toEqual({ status: 'off' })
      expect(stored()).toBeNull()
      expect(payload.data).not.toHaveProperty('cms:navigation:pl:preview')
      expect(payload.data).not.toHaveProperty(
        'cms:shop-the-look:pl:region:reg_pl:preview',
      )
      expect(payload.data['cms:navigation:pl']).toEqual(published)
      expect(replace).toHaveBeenCalledWith({
        path: '/pl/store',
        query: { page: '2' },
        hash: '',
      })
    } finally {
      mutableRouter.currentRoute = originalRoute
    }
  })
})

describe('CMS reads in the draft preview', () => {
  const Navigation = defineComponent({
    setup() {
      const { data } = useFetchNavigation()
      return () =>
        h(
          'output',
          data.value === undefined
            ? 'loading'
            : (data.value?.primaryNav[0]?.label ?? 'empty'),
        )
    },
  })

  const activate = () => {
    previewState().value = { status: 'active', token, expiresAt }
  }

  it('fetches the draft under its own key and never puts it under the published key', async () => {
    fetchNavigation.mockImplementation(async (_locale, preview) =>
      preview ? draft : published,
    )
    const wrapper = await mountSuspended(Navigation)
    await vi.waitFor(() => expect(wrapper.text()).toBe('Published'))
    expect(fetchNavigation).toHaveBeenLastCalledWith('pl', undefined)

    activate()

    await vi.waitFor(() => expect(wrapper.text()).toBe('Draft'))
    expect(fetchNavigation).toHaveBeenLastCalledWith('pl', { token })
    const { payload } = useNuxtApp()
    expect(payload.data['cms:navigation:pl:preview']).toEqual(draft)
    expect(payload.data['cms:navigation:pl']).not.toEqual(draft)
    expect(useNuxtData('cms:navigation:pl').data.value).not.toEqual(draft)
    wrapper.unmount()
  })

  it('ends the preview on a refused token instead of falling back to the published version', async () => {
    fetchNavigation.mockImplementation(async (_locale, preview) => {
      if (preview) throw createPreviewUnauthorizedError()
      return published
    })
    const wrapper = await mountSuspended(Navigation)
    await vi.waitFor(() => expect(wrapper.text()).toBe('Published'))

    activate()

    await vi.waitFor(() =>
      expect(previewState().value).toEqual({ status: 'expired' }),
    )
    await vi.waitFor(() => expect(wrapper.text()).toBe('empty'))
    // The published read before the preview and the refused draft, nothing after
    expect(fetchNavigation).toHaveBeenCalledTimes(2)
    expect(fetchNavigation).toHaveBeenLastCalledWith('pl', { token })
    wrapper.unmount()
  })

  it('after exit shows no draft while the published version loads, then the published version', async () => {
    let resolvePublished: (value: CmsNavigation) => void = () => {}
    fetchNavigation.mockImplementation((_locale, preview) =>
      preview
        ? Promise.resolve(draft)
        : new Promise((resolve) => {
            resolvePublished = resolve
          }),
    )
    activate()
    const wrapper = await mountSuspended(Navigation)
    await vi.waitFor(() => expect(wrapper.text()).toBe('Draft'))

    await usePreview().exit()

    await vi.waitFor(() =>
      expect(fetchNavigation).toHaveBeenLastCalledWith('pl', undefined),
    )
    expect(wrapper.text()).not.toBe('Draft')
    expect(useNuxtData('cms:navigation:pl').data.value).not.toEqual(draft)

    resolvePublished(published)

    await vi.waitFor(() => expect(wrapper.text()).toBe('Published'))
    expect(useNuxtApp().payload.data).not.toHaveProperty(
      'cms:navigation:pl:preview',
    )
    wrapper.unmount()
  })
})
