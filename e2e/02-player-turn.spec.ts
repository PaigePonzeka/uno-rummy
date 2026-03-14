import { test, expect } from '@playwright/test'
import { startGame, waitForPlayerTurn, rackTileCount } from './helpers'

test.describe('Player Turn Actions', () => {
  test.beforeEach(async ({ page }) => {
    await startGame(page)
    await waitForPlayerTurn(page)
  })

  test('player starts with 14 tiles in their rack', async ({ page }) => {
    const count = await rackTileCount(page)
    expect(count).toBe(14)
  })

  test('draw tile button is enabled on fresh turn', async ({ page }) => {
    await expect(page.getByTestId('draw-tile-btn')).toBeEnabled()
  })

  test('end turn button is disabled before playing tiles to the table', async ({ page }) => {
    // End Turn requires tiles played to the table (draw auto-commits — no End Turn needed for draw)
    await expect(page.getByTestId('end-turn-btn')).toBeDisabled()
  })

  test('cancel button is disabled before any action', async ({ page }) => {
    await expect(page.getByTestId('cancel-btn')).toBeDisabled()
  })

  test('drawing a tile auto-commits and advances the turn', async ({ page }) => {
    // Draw auto-commits — the turn advances to CPU immediately after drawing
    await page.getByTestId('draw-tile-btn').click()
    await expect(page.getByTestId('turn-status')).not.toHaveText('Your turn!', { timeout: 5_000 })
  })

  test('draw tile button disables while not player turn', async ({ page }) => {
    await page.getByTestId('draw-tile-btn').click()
    // After drawing the turn passes — draw button should not be interactable
    // (PlayerArea actions section exits via AnimatePresence)
    await expect(page.getByTestId('draw-tile-btn')).not.toBeVisible({ timeout: 5_000 })
  })
})
