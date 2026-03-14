// Penelope the Penguin — Medium ⭐⭐⭐
// Methodical and correct. Always plays the move that removes the most tiles.
// Never rearranges. No mistakes.

import type { Tile, TileGroup, AIPersonality, AITurn } from '@/engine/types'
import { BaseAI, registerAI } from '../baseAI'

class PenelopeAI extends BaseAI {
  readonly personality: AIPersonality = {
    mistakeProbability:    0,     // never misses
    rearrangeProbability:  0,     // never rearranges
    drawPreference:        0,
    specialAggressiveness: 0.5,
    thinkingTimeMs:        [1200, 2000],
    combosPerTurn:         3,
  }

  async decideTurn(rack: Tile[], tableGroups: TileGroup[]): Promise<AITurn> {
    await this.getThinkingDelay()

    const plays = this.limitCombos(this.findAllValidPlays(rack, tableGroups))

    if (plays.length === 0) {
      return { action: 'draw' }
    }

    // Penelope always picks the play that removes the most tiles from her rack
    const best = plays[0] // already sorted by tiles played (desc)
    const rackAfter = rack.filter(t => !best.tilesToPlay.some(p => p.id === t.id))

    return {
      action:        'play',
      tilesToPlay:   best.tilesToPlay,
      newTableState: best.newTableState,
      callUno:       this.shouldCallUno(rackAfter),
    }
  }
}

registerAI('penelope', PenelopeAI)
export default PenelopeAI
