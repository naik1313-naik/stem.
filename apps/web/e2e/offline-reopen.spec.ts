import { test, expect } from '@playwright/test'

test('the built app shell reopens without a network connection after first visit', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect(page.locator('.brand-name')).toBeVisible()
  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('.brand-name')).toBeVisible()
  await expect(page.locator('.subject-card').first()).toBeVisible()
})
