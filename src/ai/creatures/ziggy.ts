// Ziggy the Zebra — Easy ⭐
// Makes silly mistakes, never rearranges, max 1 tile per turn.

import type { Tile, TileGroup, AIPersonality, AITurn } from '@/engine/types'
import { BaseAI, registerAI } from '../baseAI'

class ZiggyAI extends BaseAI {
  readonly personality: AIPersonality = {
    mistakeProbability:    0.4,   // misses 40% of valid plays
    rearrangeProbability:  0,     // never rearranges
    drawPreference:        0.2,   // sometimes draws when could play
    specialAggressiveness: 0.2,   // plays specials randomly
    thinkingTimeMs:        [500, 1200],
    combosPerTurn:         1,     // at most 1 tile per turn
  }

  async decideTurn(rack: Tile[], tableGroups: TileGroup[]): Promise<AITurn> {
    await this.getThinkingDelay()

    const plays = this.applyMistake(this.limitCombos(this.findAllValidPlays(rack, tableGroups)))

    // Ziggy sometimes draws even when he has plays
    if (plays.length === 0 || Math.random() < this.personality.drawPreference) {
      return { action: 'draw' }
    }

    // Ziggy picks randomly rather than optimally
    const chosen = this.pick(plays.slice(0, Math.min(3, plays.length)))
    const rackAfter = rack.filter(t => !chosen.tilesToPlay.some(p => p.id === t.id))

    return {
      action:        'play',
      tilesToPlay:   chosen.tilesToPlay,
      newTableState: chosen.newTableState,
      callUno:       this.shouldCallUno(rackAfter),
    }
  }
}

registerAI('ziggy', ZiggyAI)
export default ZiggyAI
