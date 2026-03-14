import type { Page } from '@playwright/test'

/**
 * Navigate through welcome + setup screens to reach the game board.
 * Uses 1 CPU opponent (Leo) by default — fastest path to gameplay.
 */
export async function startGame(page: Page, { playerName = 'Tester' } = {}) {
  await page.goto('/')
  await page.getByTestId('name-input').fill(playerName)
  await page.getByTestId('start-btn').click()
  // Setup screen: Leo is pre-selected as 1 CPU — just distribute
  await page.getByTestId('distribute-btn').click()
  await page.waitForSelector('[data-testid="game-board"]', { timeout: 10_000 })
}

/**
 * Wait until it's the human player's turn (PLAYER_TURN phase).
 * Polls the turn-status element for "Your turn!".
 */
export async function waitForPlayerTurn(page: Page, timeout = 15_000) {
  await page.waitForFunction(
    () => {
      const el = document.querySelector('[data-testid="turn-status"]')
      return el?.textContent?.includes('Your turn!')
    },
    { timeout }
  )
}

/**
 * Count rack tiles currently visible.
 */
export async function rackTileCount(page: Page): Promise<number> {
  return page.getByTestId('rack-tile').count()
}

/**
 * Count table groups currently on the board.
 */
export async function tableGroupCount(page: Page): Promise<number> {
  return page.getByTestId('tile-group').count()
}
