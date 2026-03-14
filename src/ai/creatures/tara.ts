// Tara the Tiger — Hard ⭐⭐⭐⭐⭐
// Pure aggression. Maximizes tiles played each turn. Loves special tiles.

import type { Tile, TileGroup, GameState, AIPersonality, AITurn } from '@/engine/types'
import { BaseAI, registerAI } from '../baseAI'
import { moveTileBetweenGroups } from '@/engine/manipulationEngine'

class TaraAI extends BaseAI {
  readonly personality: AIPersonality = {
    mistakeProbability:    0,
    rearrangeProbability:  0.85,
    drawPreference:        0,
    specialAggressiveness: 1.0,   // always plays specials when possible
    thinkingTimeMs:        [800, 1800],
    combosPerTurn:         4,     // always tries to play max tiles
  }

  async decideTurn(
    rack: Tile[],
    tableGroups: TileGroup[],
    _gameState: GameState,
    _playerIndex: number,
  ): Promise<AITurn> {
    await this.getThinkingDelay()

    // Try rearrangement to maximize plays
    let workingGroups = tableGroups
    if (Math.random() < this.personality.rearrangeProbability) {
      workingGroups = this.rearrangeForMax(rack, tableGroups) ?? tableGroups
    }

    const plays = this.findAllValidPlays(rack, workingGroups)
      .filter(p => p.tilesToPlay.length <= 4)

    if (plays.length === 0) {
      return { action: 'draw' }
    }

    // Tara prioritizes: specials first, then most tiles
    const withSpecials = plays.filter(p => p.tilesToPlay.some(t => t.type !== 'number'))
    const best = withSpecials.length > 0 ? withSpecials[0] : plays[0]

    const rackAfter = rack.filter(t => !best.tilesToPlay.some(p => p.id === t.id))

    return {
      action:        'play',
      tilesToPlay:   best.tilesToPlay,
      newTableState: best.newTableState,
      callUno:       this.shouldCallUno(rackAfter),
    }
  }

  private rearrangeForMax(rack: Tile[], tableGroups: TileGroup[]): TileGroup[] | null {
    const base = this.findAllValidPlays(rack, tableGroups)
    const baseMax = base.length > 0 ? base[0].tilesToPlay.length : 0

    for (const group of tableGroups) {
      if (group.tiles.length <= 3) continue
      const tile = group.tiles[group.tiles.length - 1]

      for (const target of tableGroups) {
        if (target.id === group.id) continue
        const rearranged = moveTileBetweenGroups(tableGroups, tile.id, group.id, target.id, target.tiles.length)
        const plays = this.findAllValidPlays(rack, rearranged)
        const max = plays.length > 0 ? plays[0].tilesToPlay.length : 0
        if (max > baseMax) return rearranged
      }
    }
    return null
  }
}

registerAI('tara', TaraAI)
export default TaraAI
