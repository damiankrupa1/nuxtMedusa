import { expect, test } from '~~/tests/e2e/support/fixtures'
import { trackPayloadRequests } from '~~/tests/e2e/support/network-guard'
import { testData } from '~~/tests/e2e/support/test-data'
import { payloadGlobals } from '~~/tests/fixtures/cms'
import type { Page } from '@playwright/test'

// Regression for #42: the Payload sections rendered after a reload but
// vanished after a client-side navigation, because the browser called Payload
// directly and CORS blocked it. The server render hid it. Needs a Medusa that
// has the e2e seed (the category and products the stub's tiles and look link
// to); the editorial text comes from the local Payload stub.
const home = `/${testData.countries.primary}`

async function expectCmsSections(page: Page) {
  const { 'category-tiles': tiles, 'shop-the-look': look } = payloadGlobals
  const { 'studio-story': studio, 'journal-section': journal } = payloadGlobals
  const { brands, 'campaign-slides': campaign } = payloadGlobals

  // Section headings span two lines in some sections, so match loosely
  const lines = (first: string, second: string) =>
    new RegExp(`${first}\\s*${second}`)

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: lines(
        campaign.slides[0].headlineLine1,
        campaign.slides[0].headlineLine2,
      ),
    }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: tiles.heading })).toBeVisible()
  await expect(
    page.getByRole('heading', {
      name: lines(look.headlineLine1, look.headlineLine2),
    }),
  ).toBeVisible()
  await expect(page.getByText(brands.eyebrow, { exact: true })).toBeVisible()
  await expect(
    page.getByRole('heading', {
      name: lines(studio.headlineLine1, studio.headlineLine2),
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: journal.heading }),
  ).toBeVisible()
}

test.describe('home page CMS sections', { tag: '@medusa' }, () => {
  test('are rendered on load and again after navigating away and back', async ({
    page,
    gotoHydrated,
  }) => {
    const payload = trackPayloadRequests(page)
    const navLabel = payloadGlobals.navigation.primaryNav[0].label

    await gotoHydrated(home)
    await expectCmsSections(page)

    // Client-side navigation: the header link is a router link, no reload
    await page.getByRole('link', { name: navLabel }).first().click()
    await expect(page).toHaveURL(/\/store$/)
    await expect(
      page.getByRole('link', { name: navLabel }).first(),
    ).toBeVisible()

    await page.goBack()
    await expect(page).toHaveURL(new RegExp(`${home}/?$`))
    await expectCmsSections(page)

    // The browser must only ever reach Payload through /api/cms
    expect(payload.requests()).toEqual([])
    expect(payload.failures()).toEqual([])
  })
})
