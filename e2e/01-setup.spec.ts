import { test, expect } from '@playwright/test'

test.describe('Welcome & Setup Screens', () => {
  test('welcome screen loads and shows name input', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('UNO RUMMY UP')).toBeVisible()
    await expect(page.getByTestId('name-input')).toBeVisible()
    await expect(page.getByTestId('start-btn')).toBeDisabled()
  })

  test('start button enables after typing a name', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('name-input').fill('Alice')
    await expect(page.getByTestId('start-btn')).toBeEnabled()
  })

  test('pressing Enter in name field navigates to setup', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('name-input').fill('Alice')
    await page.getByTestId('name-input').press('Enter')
    await expect(page.getByText('Choose Your Opponents')).toBeVisible()
  })

  test('setup screen shows creature grid and distribute button', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('name-input').fill('Alice')
    await page.getByTestId('start-btn').click()
    await expect(page.getByText('Choose Your Opponents')).toBeVisible()
    await expect(page.getByTestId('distribute-btn')).toBeVisible()
    // Leo is pre-selected so distribute should be enabled
    await expect(page.getByTestId('distribute-btn')).toBeEnabled()
  })

  test('distributing tiles loads the game board', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('name-input').fill('Alice')
    await page.getByTestId('start-btn').click()
    await page.getByTestId('distribute-btn').click()
    await expect(page.getByTestId('game-board')).toBeVisible({ timeout: 10_000 })
  })
})
