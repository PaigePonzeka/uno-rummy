import { test, expect } from '@playwright/test'
import { startGame, waitForPlayerTurn, rackTileCount } from './helpers'

test.describe('Cancel Turn', () => {
  test.beforeEach(async ({ page }) => {
    await startGame(page)
    await waitForPlayerTurn(page)
  })

  test('cancel is disabled at the start of every player turn', async ({ page }) => {
    await expect(page.getByTestId('cancel-btn')).toBeDisabled()
  })

  test('cancel remains disabled at start of turn after CPU cycle', async ({ page }) => {
    // Draw auto-commits and advances; wait for next player turn
    await page.getByTestId('draw-tile-btn').click()
    await waitForPlayerTurn(page, 20_000)
    // Fresh turn — cancel should be disabled again
    await expect(page.getByTestId('cancel-btn')).toBeDisabled()
  })

  test('rack count is consistent across multiple draw cycles', async ({ page }) => {
    // Turn 1: draw, auto-commit
    const before = await rackTileCount(page)
    await page.getByTestId('draw-tile-btn').click()

    // Wait for player turn to come back
    await waitForPlayerTurn(page, 20_000)

    // Rack increased by at least 1 (CPU special cards like Draw2/Wild+4 may add more)
    const after = await rackTileCount(page)
    expect(after).toBeGreaterThanOrEqual(before + 1)
  })
})
