// Harriet the Hippo — Medium ⭐⭐⭐
// Defensive player. Prefers to draw. Targets player closest to winning with specials.

import type { Tile, TileGroup, GameState, AIPersonality, AITurn } from '@/engine/types'
import { BaseAI, registerAI } from '../baseAI'

class HarrietAI extends BaseAI {
  readonly personality: AIPersonality = {
    mistakeProbability:    0.05,
    rearrangeProbability:  0.1,
    drawPreference:        0.4,   // draws 40% of the time even with plays
    specialAggressiveness: 0.8,   // will use specials to slow down the leader
    thinkingTimeMs:        [1000, 2000],
    combosPerTurn:         2,
  }

  async decideTurn(
    rack: Tile[],
    tableGroups: TileGroup[],
    _gameState: GameState,
    _playerIndex: number,
  ): Promise<AITurn> {
    await this.getThinkingDelay()

    const plays = this.limitCombos(this.findAllValidPlays(rack, tableGroups))

    // Harriet prefers to draw (defensive)
    if (plays.length === 0 || Math.random() < this.personality.drawPreference) {
      return { action: 'draw' }
    }

    // Prefer plays that include special tiles targeting the closest-to-winning player
    const specials = plays.filter(p =>
      p.tilesToPlay.some(t => t.type !== 'number')
    )

    const chosen = specials.length > 0 && Math.random() < this.personality.specialAggressiveness
      ? this.pick(specials)
      : plays[0]

    const rackAfter = rack.filter(t => !chosen.tilesToPlay.some(p => p.id === t.id))

    return {
      action:        'play',
      tilesToPlay:   chosen.tilesToPlay,
      newTableState: chosen.newTableState,
      callUno:       this.shouldCallUno(rackAfter),
    }
  }
}

registerAI('harriet', HarrietAI)
export default HarrietAI
