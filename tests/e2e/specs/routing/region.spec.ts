import { expect, test } from '~~/tests/e2e/support/fixtures'
import { testData } from '~~/tests/e2e/support/test-data'

// Region routing needs the regions of a Medusa with the e2e seed: a PL/PLN
// region (the app's default country) and a second EUR one.
const { primary, secondary } = testData.countries

test.describe('region routing', { tag: '@medusa' }, () => {
  test('redirects the bare root to the default country', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated('/')

    await expect(page).toHaveURL(new RegExp(`/${primary}/?$`))
    await expect(page.locator('html')).toHaveAttribute('lang', 'pl')
  })

  test('takes the language from the country in the URL', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(`/${secondary}`)

    await expect(page).toHaveURL(new RegExp(`/${secondary}/?$`))
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('lets the URL, not the saved country, decide', async ({
    context,
    gotoHydrated,
    page,
    baseURL,
  }) => {
    // The visitor last browsed the secondary country...
    await context.addCookies([
      { name: 'country_code', value: secondary, url: baseURL },
    ])

    // ...but a URL in the primary one is still rendered for that country
    await gotoHydrated(`/${primary}`)

    await expect(page).toHaveURL(new RegExp(`/${primary}/?$`))
    await expect(page.locator('html')).toHaveAttribute('lang', 'pl')
  })

  test('sends a bare path to the saved country', async ({
    context,
    page,
    baseURL,
  }) => {
    await context.addCookies([
      { name: 'country_code', value: secondary, url: baseURL },
    ])

    await page.goto('/store')

    await expect(page).toHaveURL(new RegExp(`/${secondary}/store$`))
  })
})
