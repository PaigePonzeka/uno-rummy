import { test, expect } from '@playwright/test'
import { startGame, waitForPlayerTurn } from './helpers'

test.describe('CPU Turn Flow', () => {
  test('CPU completes its turn and returns control to player', async ({ page }) => {
    await startGame(page)
    await waitForPlayerTurn(page)

    // Draw auto-commits — turn passes to CPU immediately
    await page.getByTestId('draw-tile-btn').click()

    // Wait for CPU to finish and player turn to resume (allow up to 20s)
    await waitForPlayerTurn(page, 20_000)
    await expect(page.getByTestId('turn-status')).toHaveText('Your turn!')
  })

  test('game board remains visible throughout CPU turn', async ({ page }) => {
    await startGame(page)
    await waitForPlayerTurn(page)

    await page.getByTestId('draw-tile-btn').click()

    // Board must stay visible while CPU thinks
    await expect(page.getByTestId('game-board')).toBeVisible()

    // Wait for turn to come back
    await waitForPlayerTurn(page, 20_000)
    await expect(page.getByTestId('game-board')).toBeVisible()
  })
})
