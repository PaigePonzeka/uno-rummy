import { test, expect } from '@playwright/test'
import { startGame, waitForPlayerTurn, rackTileCount } from './helpers'

test.describe('Full Round Smoke Test', () => {
  test('can play through 3 turns without crashes', async ({ page }) => {
    await startGame(page)

    for (let turn = 0; turn < 3; turn++) {
      await waitForPlayerTurn(page, 20_000)
      // Each turn: draw a tile (auto-commits)
      await page.getByTestId('draw-tile-btn').click()
    }

    // After 3 player turns game board should still be intact
    await expect(page.getByTestId('game-board')).toBeVisible()
  })

  test('rack grows by 1 per draw turn', async ({ page }) => {
    await startGame(page)
    await waitForPlayerTurn(page)

    const before = await rackTileCount(page)
    await page.getByTestId('draw-tile-btn').click()
    await waitForPlayerTurn(page, 20_000)

    // At least +1 (CPU special effects like Draw2/Wild+4 may add more)
    const after = await rackTileCount(page)
    expect(after).toBeGreaterThanOrEqual(before + 1)
  })

  test('no JS errors thrown during normal gameplay', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))

    await startGame(page)
    await waitForPlayerTurn(page)
    await page.getByTestId('draw-tile-btn').click()
    await waitForPlayerTurn(page, 20_000)
    await page.getByTestId('draw-tile-btn').click()
    await waitForPlayerTurn(page, 20_000)

    expect(errors).toHaveLength(0)
  })
})
