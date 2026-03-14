// Marco the Monkey — Medium-Hard ⭐⭐⭐⭐
// Loves to rearrange! Finds combos by moving existing table tiles around.

import type { Tile, TileGroup, AIPersonality, AITurn } from '@/engine/types'
import { BaseAI, registerAI } from '../baseAI'
import { findValidPlays } from '@/engine/validationEngine'
import { moveTileBetweenGroups } from '@/engine/manipulationEngine'

class MarcoAI extends BaseAI {
  readonly personality: AIPersonality = {
    mistakeProbability:    0.05,
    rearrangeProbability:  0.8,   // Marco rearranges constantly
    drawPreference:        0.05,
    specialAggressiveness: 0.6,
    thinkingTimeMs:        [1500, 3000],
    combosPerTurn:         3,
  }

  async decideTurn(
    rack: Tile[],
    tableGroups: TileGroup[],
  ): Promise<AITurn> {
    await this.getThinkingDelay()

    // First try standard plays
    let plays = this.limitCombos(this.findAllValidPlays(rack, tableGroups))

    // Marco tries to rearrange to unlock more plays
    if (Math.random() < this.personality.rearrangeProbability) {
      const rearrangeResult = this.tryRearrangement(rack, tableGroups)
      if (rearrangeResult) {
        return rearrangeResult
      }
    }

    if (plays.length === 0 || Math.random() < this.personality.drawPreference) {
      return { action: 'draw' }
    }

    const best = plays[0]
    const rackAfter = rack.filter(t => !best.tilesToPlay.some(p => p.id === t.id))

    return {
      action:        'play',
      tilesToPlay:   best.tilesToPlay,
      newTableState: best.newTableState,
      callUno:       this.shouldCallUno(rackAfter),
    }
  }

  /** Attempt to rearrange table tiles to unlock a better play from the rack. */
  private tryRearrangement(rack: Tile[], tableGroups: TileGroup[]): AITurn | null {
    // Try moving the last tile of each group to another group, then check for new rack plays
    for (const group of tableGroups) {
      if (group.tiles.length <= 3) continue // can't steal from a 3-tile group

      const movableTile = group.tiles[group.tiles.length - 1]

      for (const targetGroup of tableGroups) {
        if (targetGroup.id === group.id) continue

        const rearranged = moveTileBetweenGroups(
          tableGroups,
          movableTile.id,
          group.id,
          targetGroup.id,
          targetGroup.tiles.length,
        )

        const newPlays = findValidPlays(rack, rearranged)
        if (newPlays.length > this.findAllValidPlays(rack, tableGroups).length) {
          // This rearrangement unlocks more plays
          const best = newPlays.sort((a, b) => b.tilesToPlay.length - a.tilesToPlay.length)[0]
          const combined = best.newTableState
          const rackAfter = rack.filter(t => !best.tilesToPlay.some(p => p.id === t.id))

          return {
            action:        'play',
            tilesToPlay:   best.tilesToPlay,
            newTableState: combined,
            callUno:       this.shouldCallUno(rackAfter),
          }
        }
      }
    }

    return null
  }
}

registerAI('marco', MarcoAI)
export default MarcoAI
