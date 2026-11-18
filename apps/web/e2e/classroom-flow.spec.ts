import { test, expect } from '@playwright/test'

test('opens the Physics Virtual Lab and returns to the subject dashboard', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Choose a subject' })).toBeVisible()
  await expect(page.locator('.group-card')).toHaveCount(0)
  await page.locator('.subject-card').nth(0).click()
  await expect(page.getByRole('navigation', { name: 'Physics classes' })).toBeVisible()
  await page.getByRole('button', { name: /Class 6/ }).click()
  await expect(page.locator('.subject-module-host__frame')).toBeVisible()

  await page.getByRole('button', { name: 'Choose subject' }).click()
  await expect(page.getByRole('heading', { name: 'Choose a subject' })).toBeVisible()
})

test('switches between all four subject labs', async ({ page }) => {
  await page.goto('/')
  for (let index = 0; index < 4; index += 1) {
    await page.locator('.subject-card').nth(index).click()
    await expect(page.locator('.subject-module-host__frame')).toBeVisible()
    await page.getByRole('button', { name: 'Choose subject' }).click()
  }
})

for (const language of ['en', 'hi'] as const) {
  test(`shows the subject dashboard without group selection: ${language}`, async ({ page }) => {
    await page.goto('/')
    if (language === 'hi') await page.locator('.language-switch button').nth(1).click()

    await expect(page.locator('.group-card')).toHaveCount(0)
    await expect(page.locator('.subject-card')).toHaveCount(4)
  })
}
