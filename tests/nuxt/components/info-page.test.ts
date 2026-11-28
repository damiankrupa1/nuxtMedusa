import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useState } from 'nuxt/app'

import InfoPage from '~/components/info/page.vue'
import InfoFaq from '~/components/info/faq.vue'
import { cmsRepository } from '~/repository/cms.repository'
import { cmsInfoPageSchema } from '~/types/cms'
import type { CmsFooterContent, CmsJournalSection } from '~/types/cms'
import type { InfoPageId } from '~/types/info-page'
import { payloadInfoPages } from '~~/tests/fixtures/cms'

vi.mock('~/repository/cms.repository', () => ({
  cmsRepository: vi.fn(),
}))

const footerContent: CmsFooterContent = {
  helpLinks: [],
  worldLinks: [],
  legalLinks: [],
  contact: {
    email: 'hello@example.com',
    phone: '+48 600 000 000',
    hours: null,
  },
  social: null,
}

const journalSection: CmsJournalSection = {
  eyebrow: 'JOURNAL',
  heading: 'Stories',
  viewAllLabel: 'All stories',
  viewAllUrl: '/journal',
  articles: [
    {
      category: 'CARE',
      readingTime: '4 min',
      title: 'Caring for wool',
      summary: 'Air it more, wash it less.',
      image: { url: 'https://cms.example.com/wool.jpg', alt: 'Wool' },
      url: '/journal/wool',
    },
  ],
}

describe('information page layout in Nuxt', () => {
  const fetchFooterContent = vi.fn<() => Promise<CmsFooterContent | null>>()
  const fetchJournalSection = vi.fn<() => Promise<CmsJournalSection | null>>()

  beforeEach(() => {
    vi.clearAllMocks()
    clearNuxtData()
    fetchFooterContent.mockResolvedValue(footerContent)
    fetchJournalSection.mockResolvedValue(journalSection)
    vi.mocked(cmsRepository).mockReturnValue({
      fetchFooterContent,
      fetchJournalSection,
    } as unknown as ReturnType<typeof cmsRepository>)
  })

  // The copy is the page's Payload global, as the repository parses it
  const mountPage = (
    id: InfoPageId,
    slug: keyof typeof payloadInfoPages,
    content = cmsInfoPageSchema.parse(payloadInfoPages[slug]),
  ) =>
    mountSuspended(
      defineComponent({
        setup() {
          useState('country').value = { iso_2: 'pl', region_id: 'reg_pl' }
          return () => h(InfoPage, { id, content })
        },
      }),
    )

  it('renders the breadcrumb, one h1 and an h2 per section from the copy', async () => {
    const wrapper = await mountPage('returns', 'info-returns')

    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Returns and complaints, in short')
    const breadcrumb = wrapper.get('nav[aria-label="Breadcrumb"]')
    expect(breadcrumb.text()).toContain('Help')
    expect(breadcrumb.get('[aria-current="page"]').text()).toBe(
      'Returns and complaints',
    )

    expect(wrapper.findAll('section > h2').map((h2) => h2.text())).toEqual([
      'Returns: withdrawing from the contract',
      'How to return a product',
      'Refunds',
      'Complaints',
    ])
    expect(wrapper.find('ol').exists()).toBe(true)
    expect(wrapper.find('ul').exists()).toBe(true)
  })

  it('renders nothing without copy: there is no stand-in text', async () => {
    const wrapper = await mountPage('terms', 'info-terms', null)

    expect(wrapper.find('h1').exists()).toBe(false)
    expect(wrapper.text()).toBe('')
  })

  it('names the legal group in the breadcrumb of a legal page', async () => {
    const wrapper = await mountPage(
      'terms',
      'info-about',
      cmsInfoPageSchema.parse(payloadInfoPages['info-about']),
    )

    expect(wrapper.get('nav[aria-label="Breadcrumb"]').text()).toContain(
      'Legal',
    )
  })

  it('links the table of contents to the sections by their anchors', async () => {
    const wrapper = await mountPage('returns', 'info-returns')

    const toc = wrapper.get('nav[aria-label="On this page"]')
    const anchors = toc.findAll('a').map((a) => a.attributes('href'))
    expect(anchors).toEqual(['#withdrawal', '#steps', '#refund', '#complaints'])
    anchors.forEach((anchor) =>
      expect(wrapper.find(`section${anchor}`).exists()).toBe(true),
    )
  })

  it('leaves the table of contents out of a page that has none', async () => {
    const wrapper = await mountPage('faq', 'info-faq')

    expect(wrapper.find('nav[aria-label="On this page"]').exists()).toBe(false)
  })

  it('sets the owner placeholders apart', async () => {
    const wrapper = await mountPage('returns', 'info-returns')

    expect(wrapper.get('p.italic').text()).toBe(
      'The return address will be added soon.',
    )
  })

  it('renders a link block as a link inside the store', async () => {
    const wrapper = await mountPage('trackOrder', 'info-track-order')

    const link = wrapper.get('#account a')
    expect(link.text()).toBe('Go to your account')
    expect(link.attributes('href')).toBe('/pl/account')
  })

  it('ends a help page with the Payload contact details', async () => {
    const wrapper = await mountPage('faq', 'info-faq')

    await vi.waitFor(() => expect(wrapper.find('#contact').exists()).toBe(true))
    const mail = wrapper.get('#contact a[href^="mailto:"]')
    expect(mail.attributes('href')).toBe('mailto:hello@example.com')
    expect(wrapper.get('#contact a[href^="tel:"]').attributes('href')).toBe(
      'tel:+48600000000',
    )
  })

  it('leaves the contact block out while Payload has no contact', async () => {
    fetchFooterContent.mockResolvedValue(null)

    const wrapper = await mountPage('faq', 'info-faq')

    await vi.waitFor(() => expect(fetchFooterContent).toHaveBeenCalled())
    expect(wrapper.find('#contact').exists()).toBe(false)
    expect(wrapper.find('a[href^="mailto:"]').exists()).toBe(false)
  })

  it('renders the FAQ as one disclosure per question', async () => {
    const wrapper = await mountPage('faq', 'info-faq')

    const questions = wrapper.findAll('details')
    expect(questions).toHaveLength(3)
    expect(questions[0]!.get('summary').text()).toBe('How do I place an order?')
    expect(questions[0]!.text()).toContain(
      'Add a product to the cart and check out.',
    )
    expect(questions.every((question) => !question.attributes('open'))).toBe(
      true,
    )
  })

  it('shares the size table with the product page', async () => {
    const wrapper = await mountPage('sizeGuide', 'info-size-guide')

    const table = wrapper.get('table')
    expect(table.get('caption').text()).toBe(
      'Approximate body measurements in centimetres.',
    )
    expect(
      table.findAll('thead th[scope="col"]').map((th) => th.text()),
    ).toEqual(['Size', 'Chest', 'Waist', 'Hips'])
    expect(table.findAll('tbody th[scope="row"]').length).toBeGreaterThan(0)
  })

  it('lists the Payload journal articles', async () => {
    const wrapper = await mountPage('journal', 'info-journal')

    await vi.waitFor(() => expect(wrapper.text()).toContain('Caring for wool'))
    expect(wrapper.get('#articles h2').text()).toBe('Latest articles')
  })

  it('renders no article section without the Payload journal', async () => {
    fetchJournalSection.mockResolvedValue(null)

    const wrapper = await mountPage('journal', 'info-journal')

    await vi.waitFor(() => expect(fetchJournalSection).toHaveBeenCalled())
    expect(wrapper.find('#articles').exists()).toBe(false)
    expect(wrapper.findAll('h1')).toHaveLength(1)
  })

  it('shows the contact block of a careers page from the footer global', async () => {
    const wrapper = await mountPage('careers', 'info-careers')

    await vi.waitFor(() =>
      expect(wrapper.find('#apply a[href^="mailto:"]').exists()).toBe(true),
    )
  })
})

describe('FAQ accordion in Nuxt', () => {
  const items = [
    { question: 'How can I pay?', answer: 'By card or BLIK.' },
    { question: 'Do I need an account?', answer: 'No.' },
  ]

  it('opens and closes a question from its summary', async () => {
    const wrapper = await mountSuspended(InfoFaq, { props: { items } })

    const [first, second] = wrapper.findAll('details')
    const firstElement = first!.element as HTMLDetailsElement
    expect(firstElement.open).toBe(false)

    await first!.get('summary').trigger('click')
    expect(firstElement.open).toBe(true)
    expect((second!.element as HTMLDetailsElement).open).toBe(false)

    await first!.get('summary').trigger('click')
    expect(firstElement.open).toBe(false)
  })

  it('keeps every answer in the markup, with a focusable summary', async () => {
    const wrapper = await mountSuspended(InfoFaq, { props: { items } })

    expect(wrapper.text()).toContain('By card or BLIK.')
    expect(wrapper.text()).toContain('No.')
    // No tabindex/role overrides: the native summary is the keyboard control
    wrapper.findAll('summary').forEach((summary) => {
      expect(summary.attributes('tabindex')).toBeUndefined()
      expect(summary.attributes('role')).toBeUndefined()
    })
  })
})
