// Gerald the Giraffe — Easy ⭐⭐
// Slow thinker, 20% miss rate, prefers simpler plays.

import type { Tile, TileGroup, AIPersonality, AITurn } from '@/engine/types'
import { BaseAI, registerAI } from '../baseAI'

class GeraldAI extends BaseAI {
  readonly personality: AIPersonality = {
    mistakeProbability:    0.2,
    rearrangeProbability:  0.05,
    drawPreference:        0.15,
    specialAggressiveness: 0.3,
    thinkingTimeMs:        [2000, 4000],  // Gerald thinks slowly
    combosPerTurn:         2,
  }

  async decideTurn(rack: Tile[], tableGroups: TileGroup[]): Promise<AITurn> {
    await this.getThinkingDelay()

    const plays = this.applyMistake(this.limitCombos(this.findAllValidPlays(rack, tableGroups)))

    if (plays.length === 0 || Math.random() < this.personality.drawPreference) {
      return { action: 'draw' }
    }

    // Gerald picks from the smaller plays (prefers simpler 1-tile plays)
    const simple = plays.filter(p => p.tilesToPlay.length === 1)
    const chosen = simple.length > 0 ? this.pick(simple) : plays[0]
    const rackAfter = rack.filter(t => !chosen.tilesToPlay.some(p => p.id === t.id))

    return {
      action:        'play',
      tilesToPlay:   chosen.tilesToPlay,
      newTableState: chosen.newTableState,
      callUno:       this.shouldCallUno(rackAfter),
    }
  }
}

registerAI('gerald', GeraldAI)
export default GeraldAI
