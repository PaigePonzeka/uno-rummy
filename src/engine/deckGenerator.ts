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
 * Returns an {x, y} canvas position where a new group of `newTileCount` tiles
 * will not overlap any existing group's bounding box (including a MARGIN gap).
 *
 * Uses real bounding-box collision: each group's width is `tiles.length * TILE_W + PADDING`.
 */
export function findFreePosition(groups: TileGroup[], newTileCount = 3): { x: number; y: number } {
  const TILE_W   = 54   // px per tile slot
  const PADDING  = 24   // ~8px padding each side + border
  const GROUP_H  = 90
  const MARGIN   = 8    // minimum gap between group borders
  const ORIGIN_X = 20
  const ORIGIN_Y = 20
  const CANVAS_W = 920  // conservative canvas width

  const newW = newTileCount * TILE_W + PADDING

  const boxes = groups.map(g => ({
    x: g.position.x,
    y: g.position.y,
    w: g.tiles.length * TILE_W + PADDING,
    h: GROUP_H,
  }))

  function overlaps(x: number, y: number): boolean {
    return boxes.some(b =>
      x < b.x + b.w + MARGIN &&
      x + newW + MARGIN > b.x &&
      y < b.y + b.h + MARGIN &&
      y + GROUP_H + MARGIN > b.y
    )
  }

  const stepX = newW + MARGIN
  const stepY = GROUP_H + MARGIN

  for (let row = 0; row < 20; row++) {
    for (let col = 0; ORIGIN_X + col * stepX + newW <= CANVAS_W; col++) {
      const x = ORIGIN_X + col * stepX
      const y = ORIGIN_Y + row * stepY
      if (!overlaps(x, y)) return { x, y }
    }
  }

  // Fallback: place below all existing groups
  const maxY = groups.reduce((m, g) => Math.max(m, g.position.y + GROUP_H), 0)
  return { x: ORIGIN_X, y: maxY + MARGIN }
}

/**
 * Repositions all groups to the most center-available non-colliding position.
 * Groups closer to the canvas center get first pick; others pack outward.
 */
export function snapGroupsToCenter(
  groups: TileGroup[],
  canvasW: number,
  canvasH: number,
): TileGroup[] {
  if (groups.length === 0 || canvasW === 0 || canvasH === 0) return groups

  const TILE_W  = 54
  const PADDING = 24
  const GROUP_H = 90
  const MARGIN  = 8
  const STEP    = 8
  const cx = canvasW / 2
  const cy = canvasH / 2

  // Groups nearest to canvas center get placed first
  const sorted = [...groups].sort((a, b) => {
    const aw = a.tiles.length * TILE_W + PADDING
    const bw = b.tiles.length * TILE_W + PADDING
    const da = Math.hypot(a.position.x + aw / 2 - cx, a.position.y + GROUP_H / 2 - cy)
    const db = Math.hypot(b.position.x + bw / 2 - cx, b.position.y + GROUP_H / 2 - cy)
    return da - db
  })

  const placed: Array<{ x: number; y: number; w: number; h: number }> = []

  function overlaps(x: number, y: number, gw: number): boolean {
    return placed.some(b =>
      x < b.x + b.w + MARGIN &&
      x + gw + MARGIN > b.x &&
      y < b.y + GROUP_H + MARGIN &&
      y + GROUP_H + MARGIN > b.y
    )
  }

  function inBounds(x: number, y: number, gw: number): boolean {
    return x >= 4 && y >= 4 && x + gw <= canvasW - 4 && y + GROUP_H <= canvasH - 4
  }

  function findBest(gw: number): { x: number; y: number } {
    const ix = Math.round((cx - gw / 2) / STEP) * STEP
    const iy = Math.round((cy - GROUP_H / 2) / STEP) * STEP

    if (inBounds(ix, iy, gw) && !overlaps(ix, iy, gw)) return { x: ix, y: iy }

    const maxR = Math.ceil(Math.max(canvasW, canvasH) / STEP)
    for (let r = 1; r <= maxR; r++) {
      const rs = r * STEP
      for (let d = -r; d <= r; d++) {
        const candidates: Array<[number, number]> = [
          [ix + d * STEP, iy - rs],
          [ix + d * STEP, iy + rs],
          [ix - rs, iy + d * STEP],
          [ix + rs, iy + d * STEP],
        ]
        for (const [x, y] of candidates) {
          if (inBounds(x, y, gw) && !overlaps(x, y, gw)) return { x, y }
        }
      }
    }

    return { x: ix, y: iy }
  }

  return sorted.map(g => {
    const gw  = g.tiles.length * TILE_W + PADDING
    const pos = findBest(gw)
    placed.push({ x: pos.x, y: pos.y, w: gw, h: GROUP_H })
    return { ...g, position: pos }
  })
}

/**
 * Resolves position conflicts for newly created groups only.
 * Existing groups are never moved. Each new group is nudged to the nearest
 * collision-free position expanding outward from its current drop position.
 */
export function resolveNewGroupCollisions(
  newGroups: TileGroup[],
  existingGroups: TileGroup[],
  canvasW: number,
  canvasH: number,
): TileGroup[] {
  if (newGroups.length === 0 || canvasW === 0 || canvasH === 0) return newGroups

  const TILE_W  = 54
  const PADDING = 24
  const GROUP_H = 90
  const MARGIN  = 8
  const STEP    = 8

  // Seed with existing group bounding boxes so new groups avoid them
  const placed: Array<{ x: number; y: number; w: number; h: number }> = existingGroups.map(g => ({
    x: g.position.x,
    y: g.position.y,
    w: g.tiles.length * TILE_W + PADDING,
    h: GROUP_H,
  }))

  function overlaps(x: number, y: number, gw: number): boolean {
    return placed.some(b =>
      x < b.x + b.w + MARGIN &&
      x + gw + MARGIN > b.x &&
      y < b.y + b.h + MARGIN &&
      y + GROUP_H + MARGIN > b.y
    )
  }

  function inBounds(x: number, y: number, gw: number): boolean {
    return x >= 4 && y >= 4 && x + gw <= canvasW - 4 && y + GROUP_H <= canvasH - 4
  }

  return newGroups.map(g => {
    const gw = g.tiles.length * TILE_W + PADDING
    // Snap origin to grid
    const ix = Math.round(g.position.x / STEP) * STEP
    const iy = Math.round(g.position.y / STEP) * STEP

    if (inBounds(ix, iy, gw) && !overlaps(ix, iy, gw)) {
      placed.push({ x: ix, y: iy, w: gw, h: GROUP_H })
      return { ...g, position: { x: ix, y: iy } }
    }

    // Expand outward from the drop position until a free spot is found
    const maxR = Math.ceil(Math.max(canvasW, canvasH) / STEP)
    for (let r = 1; r <= maxR; r++) {
      const rs = r * STEP
      for (let d = -r; d <= r; d++) {
        const candidates: Array<[number, number]> = [
          [ix + d * STEP, iy - rs],
          [ix + d * STEP, iy + rs],
          [ix - rs, iy + d * STEP],
          [ix + rs, iy + d * STEP],
        ]
        for (const [x, y] of candidates) {
          if (inBounds(x, y, gw) && !overlaps(x, y, gw)) {
            placed.push({ x, y, w: gw, h: GROUP_H })
            return { ...g, position: { x, y } }
          }
        }
      }
    }

    // Fallback: keep original position
    placed.push({ x: ix, y: iy, w: gw, h: GROUP_H })
    return { ...g, position: { x: ix, y: iy } }
  })
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
