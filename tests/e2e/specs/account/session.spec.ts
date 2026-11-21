import { expect, test } from '~~/tests/e2e/support/fixtures'
import { testData } from '~~/tests/e2e/support/test-data'

// #81: the server render of the account page used to fetch the customer
// without the visitor's cookies (the global $fetch), so a signed-in customer
// who reloaded it got the sign-in form. The page is loaded with JavaScript
// off, so what is asserted is the server-rendered markup, not what the
// browser fetched after hydration.
const country = testData.countries.primary
// The primary country renders in Polish (i18n/locales/pl.json:
// auth.signin.submit, pages.account.signOut)
const signIn = 'Zaloguj się'
const signOut = 'Wyloguj się'

test.describe(
  'customer session in the server render',
  { tag: '@medusa' },
  () => {
    test.use({ javaScriptEnabled: false })

    test('a signed-in customer reloading the account page gets their account', async ({
      page,
    }) => {
      // A customer of its own. page.request shares the browser context's
      // cookies, so the HttpOnly session cookie it gets back goes with the page
      // request below.
      const email = `e2e-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
      const registered = await page.request.post('/api/customers/register', {
        data: {
          first_name: 'Session',
          last_name: 'Check',
          email,
          password: 'e2e-password',
        },
      })
      expect(registered.status()).toBe(200)

      const response = await page.goto(`/${country}/account`)

      expect(response?.status()).toBe(200)
      await expect(page.getByText(email)).toBeVisible()
      await expect(page.getByRole('button', { name: signOut })).toBeVisible()
      await expect(page.getByRole('button', { name: signIn })).toHaveCount(0)
    })

    test('a visitor without a session gets the sign-in form', async ({
      page,
    }) => {
      await page.goto(`/${country}/account`)

      await expect(page.getByRole('button', { name: signIn })).toBeVisible()
      await expect(page.getByRole('button', { name: signOut })).toHaveCount(0)
    })
  },
)
