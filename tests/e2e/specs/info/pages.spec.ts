import { expect, test } from '~~/tests/e2e/support/fixtures'
import { trackPageErrors } from '~~/tests/e2e/support/page-errors'
import { testData } from '~~/tests/e2e/support/test-data'
import { INFO_PAGES } from '~/utils/info-pages'

// The information pages linked from the footer (#107). They need no backend:
// the copy is in i18n, and Payload (the stub) only adds the contact details
// and the journal's articles. Without Medusa no region is loaded, so the
// pages render in the default locale (English); the Polish render needs the
// regions and is checked in the @medusa block below.
const country = testData.countries.primary

test.describe('information pages', () => {
  INFO_PAGES.forEach((page) => {
    test(`${page.path} answers 200 with one h1 and the draft gate`, async ({
      request,
    }) => {
      const response = await request.get(`/${country}${page.path}`)

      expect(response.status()).toBe(200)
      const html = await response.text()
      expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
      // Every page is a draft until the owner has reviewed it
      expect(html).toMatch(/<meta name="robots" content="noindex, follow"/)
      expect(html).not.toContain('rel="canonical"')
      expect(html).not.toContain('"FAQPage"')
    })
  })

  test('opens and closes a question with the keyboard', async ({
    gotoHydrated,
    page,
  }) => {
    const errors = trackPageErrors(page)
    await gotoHydrated(`/${country}/help/faq`)

    const question = page.locator('details').first()
    const summary = question.locator('summary')
    await expect(question).not.toHaveAttribute('open')

    await summary.focus()
    await page.keyboard.press('Enter')
    await expect(question).toHaveAttribute('open')

    await page.keyboard.press('Space')
    await expect(question).not.toHaveAttribute('open')

    // The next question is the next tab stop
    await page.keyboard.press('Tab')
    await expect(
      page.locator('details').nth(1).locator('summary'),
    ).toBeFocused()

    expect(errors.errors()).toEqual([])
  })
})

test.describe('information pages with regions', { tag: '@medusa' }, () => {
  test('render in Polish for the Polish store', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(`/${country}/help/returns`)

    await expect(page.locator('html')).toHaveAttribute('lang', 'pl')
    // i18n/locales/pl.json: pages.returns.heading
    await expect(
      page.getByRole('heading', { level: 1, name: 'Zwroty i reklamacje' }),
    ).toBeVisible()
  })

  test('stay out of the sitemap while they are drafts', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()

    expect(sitemap).toContain('<loc>')
    INFO_PAGES.forEach((page) => {
      expect(sitemap).not.toContain(`${page.path}</loc>`)
    })
  })
})
