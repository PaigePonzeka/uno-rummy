import type { Tile, TileColor, TileGroup } from './types'

// ============================================================
// Slot configuration
// Slots 2, 5, 7 are special tiles; remaining are number tiles
// ============================================================

const COLORS: TileColor[] = ['red', 'blue', 'green', 'yellow']

const NUMBER_SLOTS = [1, 3, 4, 6, 8, 9, 10, 11, 12] as const

const SPECIAL_SLOTS = [
  { slot: 2, type: 'draw2' as const,   display: 2  },
  { slot: 5, type: 'skip' as const,    display: 5  },
  { slot: 7, type: 'reverse' as const, display: 7  },
] as const

// ============================================================
// Deck generation
// ============================================================

function generateId(parts: (string | number)[]): string {
  return parts.join('_')
}

/** Creates the full 100-tile deck (unshuffled). */
export function generateDeck(): Tile[] {
  const tiles: Tile[] = []

  // Number tiles: 9 values × 4 colors × 2 copies = 72 tiles
  for (const color of COLORS) {
    for (const slot of NUMBER_SLOTS) {
      for (const copy of ['a', 'b'] as const) {
        tiles.push({
          id:            generateId([color, slot, copy]),
          color,
          type:          'number',
          slot,
          displayNumber: slot,
          scoreValue:    slot,
          isWild:        false,
        })
      }
    }
  }

  // Special tiles: 3 types × 4 colors × 2 copies = 24 tiles
  for (const color of COLORS) {
    for (const special of SPECIAL_SLOTS) {
      for (const copy of ['a', 'b'] as const) {
        tiles.push({
          id:            generateId([color, special.type, copy]),
          color,
          type:          special.type,
          slot:          special.slot,
          displayNumber: special.display,
          scoreValue:    20,
          isWild:        false,
        })
      }
    }
  }

  // Wild Draw Four: 4 tiles, no color
  for (let i = 0; i < 4; i++) {
    tiles.push({
      id:            `wild_${i}`,
      color:         null,
      type:          'wildDrawFour',
      slot:          0,
      displayNumber: null,
      scoreValue:    50,
      isWild:        true,
    })
  }

  // Verify count
  if (tiles.length !== 100) {
    throw new Error(`Expected 100 tiles, got ${tiles.length}`)
  }

  return tiles
}

// ============================================================
// Shuffle
// ============================================================

/** Fisher-Yates in-place shuffle. Returns the same array. */
export function shuffleDeck(tiles: Tile[]): Tile[] {
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[tiles[i], tiles[j]] = [tiles[j], tiles[i]]
  }
  return tiles
}

// ============================================================
// Deal
// ============================================================

export interface DealtGame {
  /** One array of tiles per player, in player order */
  hands: Tile[][]
  /** 4 starter tiles placed face-up on the table */
  tableStarters: TileGroup[]
  /** Remaining tiles for the draw pile */
  drawPile: Tile[]
}

let _groupIdCounter = 0
export function newGroupId(): string {
  return `g_${++_groupIdCounter}_${Date.now()}`
}

/**
 * Returns an {x, y} canvas position not already occupied by an existing group.
 * Scans a 3-column grid (180×95px cells, origin at 20,20) and returns the first free slot.
 */
export function findFreePosition(groups: TileGroup[]): { x: number; y: number } {
  const COLS    = 3
  const CELL_W  = 180
  const CELL_H  = 95
  const ORIGIN_X = 20
  const ORIGIN_Y = 20

  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = ORIGIN_X + col * CELL_W
      const y = ORIGIN_Y + row * CELL_H
      const occupied = groups.some(g =>
        Math.abs(g.position.x - x) < CELL_W / 2 &&
        Math.abs(g.position.y - y) < CELL_H / 2
      )
      if (!occupied) return { x, y }
    }
  }
  return { x: ORIGIN_X, y: ORIGIN_Y }
}

/**
 * Deals initial hands and table starters from a shuffled deck.
 *
 * @param deck     Shuffled 100-tile deck
 * @param playerCount  2–4
 */
export function dealInitialHands(deck: Tile[], playerCount: number): DealtGame {
  if (playerCount < 2 || playerCount > 4) {
    throw new Error('Player count must be 2–4')
  }

  const pile = [...deck]

  // Deal 14 tiles to each player
  const hands: Tile[][] = Array.from({ length: playerCount }, () => {
    const hand: Tile[] = []
    for (let i = 0; i < 14; i++) {
      const tile = pile.shift()
      if (!tile) throw new Error('Deck ran out during deal')
      hand.push(tile)
    }
    return hand
  })

  return {
    hands,
    tableStarters: [],
    drawPile: pile,
  }
}
