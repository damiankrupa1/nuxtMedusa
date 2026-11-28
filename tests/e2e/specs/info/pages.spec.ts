import { expect, test } from '~~/tests/e2e/support/fixtures'
import { trackPageErrors } from '~~/tests/e2e/support/page-errors'
import { testData } from '~~/tests/e2e/support/test-data'
import { INFO_PAGES } from '~/utils/info-pages'
import { payloadInfoPages } from '~~/tests/fixtures/cms'

// The information pages linked from the footer (#107, #121). They need no
// Medusa: the copy is the page's Payload global (the stub, which answers `{}`
// for the four legal pages, like the real Payload until the owner has written
// them). Without Medusa no region is loaded, so the pages render in the
// default locale (English); the Polish render needs the regions and is
// checked in the @medusa block below.
const country = testData.countries.primary

const hasCopy = (slug: keyof typeof payloadInfoPages) =>
  Object.keys(payloadInfoPages[slug]).length > 0

test.describe('information pages', () => {
  INFO_PAGES.filter((page) => !hasCopy(page.slug)).forEach((page) => {
    test(`${page.path} answers 404 while Payload has no copy for it`, async ({
      request,
    }) => {
      const response = await request.get(`/${country}${page.path}`)

      expect(response.status()).toBe(404)
    })
  })

  INFO_PAGES.filter((page) => hasCopy(page.slug)).forEach((page) => {
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
    // The stub answers both locales with the same copy (tests/fixtures/cms.ts)
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: payloadInfoPages['info-returns'].heading,
      }),
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
