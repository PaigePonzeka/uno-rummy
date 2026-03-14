// Polly the Parrot — Medium ⭐⭐⭐
// Chaotic! Shuffles the valid plays and picks randomly. Unpredictable!

import type { Tile, TileGroup, AIPersonality, AITurn } from '@/engine/types'
import { BaseAI, registerAI } from '../baseAI'

class PollyAI extends BaseAI {
  readonly personality: AIPersonality = {
    mistakeProbability:    0.05,
    rearrangeProbability:  0.3,
    drawPreference:        0.1,
    specialAggressiveness: 0.5,
    thinkingTimeMs:        [300, 800],  // quick and impulsive
    combosPerTurn:         3,
  }

  async decideTurn(rack: Tile[], tableGroups: TileGroup[]): Promise<AITurn> {
    await this.getThinkingDelay()

    const plays = this.limitCombos(this.findAllValidPlays(rack, tableGroups))

    if (plays.length === 0 || Math.random() < this.personality.drawPreference) {
      return { action: 'draw' }
    }

    // Polly shuffles all plays and picks truly at random
    const shuffled = [...plays].sort(() => Math.random() - 0.5)
    const chosen = shuffled[0]
    const rackAfter = rack.filter(t => !chosen.tilesToPlay.some(p => p.id === t.id))

    return {
      action:        'play',
      tilesToPlay:   chosen.tilesToPlay,
      newTableState: chosen.newTableState,
      callUno:       this.shouldCallUno(rackAfter),
    }
  }
}

registerAI('polly', PollyAI)
export default PollyAI
