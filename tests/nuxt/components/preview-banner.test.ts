import { beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useNuxtApp, useState } from 'nuxt/app'

import PreviewBanner from '~/components/app/preview-banner.vue'
import type { PreviewState } from '~/types/preview'
import { PREVIEW_STORAGE_KEY } from '~/types/preview'

const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl'
const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

describe('AppPreviewBanner', () => {
  const previewState = () => useState<PreviewState>('preview')

  beforeEach(() => {
    previewState().value = { status: 'off' }
    sessionStorage.clear()
    useNuxtApp().$i18n.locale.value = 'en'
  })

  it('renders nothing outside the preview, as in every server render', async () => {
    const wrapper = await mountSuspended(PreviewBanner)

    expect(wrapper.find('aside').exists()).toBe(false)
    expect(wrapper.text()).toBe('')
  })

  it('names the active preview and when it ends, in a status region', async () => {
    previewState().value = { status: 'active', token, expiresAt }

    const wrapper = await mountSuspended(PreviewBanner)

    const banner = wrapper.get('aside')
    expect(banner.attributes('aria-label')).toBe('Draft preview')
    const status = banner.get('[role="status"]')
    expect(status.text()).toContain('unpublished changes')
    expect(status.text()).toMatch(/Valid until \d{1,2}:\d{2}/)
    expect(wrapper.html()).not.toContain(token)
  })

  it('says the preview has expired instead of quietly showing something else', async () => {
    previewState().value = { status: 'active', token, expiresAt }
    const wrapper = await mountSuspended(PreviewBanner)

    previewState().value = { status: 'expired' }
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[role="status"]').text()).toContain(
      'The preview has expired',
    )
    expect(wrapper.get('button').text()).toBe('Exit preview')
  })

  it('leaves the preview from its button', async () => {
    previewState().value = { status: 'active', token, expiresAt }
    sessionStorage.setItem(
      PREVIEW_STORAGE_KEY,
      JSON.stringify({ token, expiresAt }),
    )
    const wrapper = await mountSuspended(PreviewBanner)

    await wrapper.get('button').trigger('click')

    expect(previewState().value).toEqual({ status: 'off' })
    expect(sessionStorage.getItem(PREVIEW_STORAGE_KEY)).toBeNull()
    expect(wrapper.find('aside').exists()).toBe(false)
  })
})
