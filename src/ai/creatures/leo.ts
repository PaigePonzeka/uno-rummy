// Leo the Lion — Hard ⭐⭐⭐⭐⭐
// The king. Optimal play, strategic use of specials, full rearrangement.

import type { Tile, TileGroup, GameState, AIPersonality, AITurn } from '@/engine/types'
import { BaseAI, registerAI } from '../baseAI'
import { findValidPlays } from '@/engine/validationEngine'
import { moveTileBetweenGroups } from '@/engine/manipulationEngine'

class LeoAI extends BaseAI {
  readonly personality: AIPersonality = {
    mistakeProbability:    0,
    rearrangeProbability:  0.9,
    drawPreference:        0,
    specialAggressiveness: 0.95,  // Leo always uses specials strategically
    thinkingTimeMs:        [2000, 3500],
    combosPerTurn:         4,
  }

  async decideTurn(
    rack: Tile[],
    tableGroups: TileGroup[],
    gameState: GameState,
    playerIndex: number,
  ): Promise<AITurn> {
    await this.getThinkingDelay()

    // Try rearrangement first to maximize plays
    const rearranged = this.bestRearrangement(rack, tableGroups)
    const workingGroups = rearranged ?? tableGroups

    // Consider wild swaps — Leo swaps if it strictly increases play options
    const wildSwaps = this.findWildSwaps(rack, workingGroups)
    for (const swap of wildSwaps) {
      const rackAfterSwap = rack.filter(t => t.id !== swap.replacement.id).concat(swap.wild)
      const playsAfterSwap = this.findAllValidPlays(rackAfterSwap, swap.newTableState)
        .filter(p => p.tilesToPlay.length <= this.personality.combosPerTurn)
      const playsNow = this.findAllValidPlays(rack, workingGroups)
        .filter(p => p.tilesToPlay.length <= this.personality.combosPerTurn)
      if (playsAfterSwap.length > playsNow.length) {
        return {
          action:        'play',
          tilesToPlay:   [swap.replacement],
          newTableState: swap.newTableState,
          wildsReceived: [swap.wild],
          callUno:       this.shouldCallUno(rackAfterSwap),
        }
      }
    }

    const plays = this.findAllValidPlays(rack, workingGroups)
      .filter(p => p.tilesToPlay.length <= this.personality.combosPerTurn)

    if (plays.length === 0) {
      return { action: 'draw' }
    }

    // Leo scores each play and picks the best
    const scored = plays.map(play => ({
      play,
      score: this.scorePlaY(play, rack, gameState, playerIndex),
    }))
    scored.sort((a, b) => b.score - a.score)

    const best = scored[0].play
    const rackAfter = rack.filter(t => !best.tilesToPlay.some(p => p.id === t.id))

    return {
      action:        'play',
      tilesToPlay:   best.tilesToPlay,
      newTableState: best.newTableState,
      callUno:       this.shouldCallUno(rackAfter),
    }
  }

  private scorePlaY(play: ReturnType<typeof findValidPlays>[0], rack: Tile[], _gameState: GameState, _playerIndex: number): number {
    let score = 0

    // Reward removing more tiles
    score += play.tilesToPlay.length * 10

    // Reward using specials against the closest-to-winning player
    const hasSpecial = play.tilesToPlay.some(t => t.type !== 'number')
    if (hasSpecial) {
      score += 20
    }

    // Big reward for going out
    const rackAfter = rack.filter(t => !play.tilesToPlay.some(p => p.id === t.id))
    if (rackAfter.length === 0) score += 1000

    return score
  }

  /** Find the best single rearrangement that increases play options. */
  private bestRearrangement(rack: Tile[], tableGroups: TileGroup[]): TileGroup[] | null {
    const basePlayCount = this.findAllValidPlays(rack, tableGroups).length
    let bestGroups: TileGroup[] | null = null
    let bestCount = basePlayCount

    for (const group of tableGroups) {
      if (group.tiles.length <= 3) continue

      for (const targetGroup of tableGroups) {
        if (targetGroup.id === group.id) continue

        const tile = group.tiles[group.tiles.length - 1]
        const rearranged = moveTileBetweenGroups(
          tableGroups,
          tile.id,
          group.id,
          targetGroup.id,
          targetGroup.tiles.length,
        )

        const count = this.findAllValidPlays(rack, rearranged).length
        if (count > bestCount) {
          bestCount = count
          bestGroups = rearranged
        }
      }
    }

    return bestGroups
  }
}

registerAI('leo', LeoAI)
export default LeoAI
