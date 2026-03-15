import type {
  Tile,
  TileGroup,
  GameState,
  AIPersonality,
  AITurn,
  ZooCreatureKey,
  PlayOption,
} from '@/engine/types'
import { findValidPlays } from '@/engine/validationEngine'
import { canReplaceWild, swapWildInGroup } from '@/engine/manipulationEngine'

export interface WildSwapOption {
  wild:         Tile
  replacement:  Tile
  groupId:      string
  newTableState: TileGroup[]
}

// ============================================================
// Abstract base class
// ============================================================

export abstract class BaseAI {
  abstract readonly personality: AIPersonality

  /**
   * Decide what to do on this turn.
   * Returns a Promise so we can add artificial delay for realism.
   */
  abstract decideTurn(
    rack: Tile[],
    tableGroups: TileGroup[],
    gameState: GameState,
    playerIndex: number,
  ): Promise<AITurn>

  // ── Shared utilities ────────────────────────────────────

  protected findAllValidPlays(rack: Tile[], tableGroups: TileGroup[]): PlayOption[] {
    return findValidPlays(rack, tableGroups)
  }

  protected shouldCallUno(rackAfterPlay: Tile[]): boolean {
    return rackAfterPlay.length === 1
  }

  protected async getThinkingDelay(): Promise<void> {
    const [min, max] = this.personality.thinkingTimeMs
    const delay = min + Math.random() * (max - min)
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  /** Pick the best special target (player closest to winning). */
  protected pickSpecialTarget(gameState: GameState, myIndex: number): number {
    const others = gameState.players
      .map((p, i) => ({ p, i }))
      .filter(({ i }) => i !== myIndex)

    // Target the player with the fewest tiles
    const closest = others.reduce((best, cur) =>
      cur.p.rack.length < best.p.rack.length ? cur : best
    )
    return closest.i
  }

  /** Find all legal wild swaps available given the current rack and table. */
  protected findWildSwaps(rack: Tile[], tableGroups: TileGroup[]): WildSwapOption[] {
    const results: WildSwapOption[] = []
    for (const group of tableGroups) {
      for (const tile of group.tiles) {
        if (!tile.isWild) continue
        for (const rackTile of rack) {
          if (canReplaceWild(rackTile, tile.id, group)) {
            results.push({
              wild:          tile,
              replacement:   rackTile,
              groupId:       group.id,
              newTableState: swapWildInGroup(tableGroups, group.id, tile.id, rackTile),
            })
          }
        }
      }
    }
    return results
  }

  /** Randomly pick from an array. */
  protected pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  /** Apply mistake probability — may return an empty list to simulate "missing" a play. */
  protected applyMistake(plays: PlayOption[]): PlayOption[] {
    if (plays.length === 0) return []
    if (Math.random() < this.personality.mistakeProbability) return []
    return plays
  }

  /** Limit plays to combosPerTurn. */
  protected limitCombos(plays: PlayOption[]): PlayOption[] {
    return plays.filter(p => p.tilesToPlay.length <= this.personality.combosPerTurn)
  }
}

// ============================================================
// Registry + factory
// ============================================================

type AIConstructor = new () => BaseAI

const aiRegistry: Partial<Record<ZooCreatureKey, AIConstructor>> = {}

export function registerAI(key: ZooCreatureKey, ctor: AIConstructor) {
  aiRegistry[key] = ctor
}

export function getAI(key: ZooCreatureKey): BaseAI {
  const Ctor = aiRegistry[key]
  if (!Ctor) {
    // Fallback to a default medium AI
    return new DefaultAI()
  }
  return new Ctor()
}

// ============================================================
// Default (medium) AI — used as fallback
// ============================================================

class DefaultAI extends BaseAI {
  readonly personality: AIPersonality = {
    mistakeProbability:    0.1,
    rearrangeProbability:  0.2,
    drawPreference:        0.1,
    specialAggressiveness: 0.5,
    thinkingTimeMs:        [800, 1500],
    combosPerTurn:         2,
  }

  async decideTurn(rack: Tile[], tableGroups: TileGroup[]): Promise<AITurn> {
    await this.getThinkingDelay()

    const plays = this.applyMistake(this.limitCombos(this.findAllValidPlays(rack, tableGroups)))

    if (plays.length === 0 || Math.random() < this.personality.drawPreference) {
      return { action: 'draw' }
    }

    const best = plays[0]
    const rackAfterPlay = rack.filter(t => !best.tilesToPlay.some(p => p.id === t.id))

    return {
      action:        'play',
      tilesToPlay:   best.tilesToPlay,
      newTableState: best.newTableState,
      callUno:       this.shouldCallUno(rackAfterPlay),
    }
  }
}
