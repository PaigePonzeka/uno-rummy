import type { Tile, TileGroup, RearrangementResult } from './types'
import { newGroupId } from './deckGenerator'
import { isValidGroup, annotateGroups } from './validationEngine'

// ============================================================
// Pure tile movement operations
// All functions are immutable — they return new state, never mutate.
// ============================================================

/** Deep-clone a tile group array (used for turn snapshots). */
export function cloneGroups(groups: TileGroup[]): TileGroup[] {
  return groups.map(g => ({
    ...g,
    tiles:    [...g.tiles],
    position: { ...g.position },
  }))
}

/** Deep-clone a tile array. */
export function cloneTiles(tiles: Tile[]): Tile[] {
  return tiles.map(t => ({ ...t }))
}

// ============================================================
// Group repositioning
// ============================================================

/** Move a group to a new canvas position. */
export function moveGroup(
  groups: TileGroup[],
  groupId: string,
  position: { x: number; y: number },
): TileGroup[] {
  return groups.map(g =>
    g.id === groupId ? { ...g, position: { ...position } } : g
  )
}

// ============================================================
// Tile insertion into an existing group
// ============================================================

/**
 * Move a tile from one group to another, inserting it at `insertIndex`.
 * If `fromGroupId` becomes empty after removal, it is dropped from the array.
 */
export function moveTileBetweenGroups(
  groups: TileGroup[],
  tileId: string,
  fromGroupId: string,
  toGroupId: string,
  insertIndex: number,
): TileGroup[] {
  let movedTile: Tile | undefined

  let updated = groups.map(g => {
    if (g.id === fromGroupId) {
      const idx = g.tiles.findIndex(t => t.id === tileId)
      if (idx === -1) return g
      movedTile = g.tiles[idx]
      const tiles = g.tiles.filter(t => t.id !== tileId)
      return { ...g, tiles }
    }
    return g
  })

  if (!movedTile) return groups // tile not found — no-op

  updated = updated.map(g => {
    if (g.id === toGroupId) {
      const clamped = Math.max(0, Math.min(insertIndex, g.tiles.length))
      const tiles = [
        ...g.tiles.slice(0, clamped),
        movedTile!,
        ...g.tiles.slice(clamped),
      ]
      return { ...g, tiles }
    }
    return g
  })

  // Remove empty groups
  updated = updated.filter(g => g.tiles.length > 0)

  return annotateGroups(updated)
}

// ============================================================
// Group splitting
// ============================================================

/**
 * Split a group at `splitIndex`. Tiles [0, splitIndex) stay in the original
 * group; tiles [splitIndex, end) form a new group at `newPosition`.
 */
export function splitGroup(
  groups: TileGroup[],
  groupId: string,
  splitIndex: number,
  newPosition: { x: number; y: number },
): TileGroup[] {
  const target = groups.find(g => g.id === groupId)
  if (!target || splitIndex <= 0 || splitIndex >= target.tiles.length) {
    return groups
  }

  const leftTiles  = target.tiles.slice(0, splitIndex)
  const rightTiles = target.tiles.slice(splitIndex)

  const updated: TileGroup[] = groups.flatMap(g => {
    if (g.id !== groupId) return [g]
    return [
      { ...g, tiles: leftTiles },
      {
        id:       newGroupId(),
        tiles:    rightTiles,
        position: newPosition,
        type:     'incomplete' as const,
      },
    ]
  })

  return annotateGroups(updated)
}

// ============================================================
// Group merging
// ============================================================

/**
 * Merge `sourceGroupId` into `targetGroupId`, inserting all source tiles
 * at `insertIndex` within the target group.
 * The source group is removed.
 */
export function mergeGroups(
  groups: TileGroup[],
  sourceGroupId: string,
  targetGroupId: string,
  insertIndex: number,
): TileGroup[] {
  const source = groups.find(g => g.id === sourceGroupId)
  const target = groups.find(g => g.id === targetGroupId)
  if (!source || !target || sourceGroupId === targetGroupId) return groups

  const clamped = Math.max(0, Math.min(insertIndex, target.tiles.length))
  const mergedTiles = [
    ...target.tiles.slice(0, clamped),
    ...source.tiles,
    ...target.tiles.slice(clamped),
  ]

  const updated = groups
    .filter(g => g.id !== sourceGroupId)
    .map(g =>
      g.id === targetGroupId ? { ...g, tiles: mergedTiles } : g
    )

  return annotateGroups(updated)
}

// ============================================================
// Creating a new group from rack tiles
// ============================================================

/**
 * Creates a new tile group from rack tiles placed on the canvas.
 * `tiles` must already be removed from the player rack (done in store).
 */
export function createGroupFromTiles(
  groups: TileGroup[],
  tiles: Tile[],
  position: { x: number; y: number },
): TileGroup[] {
  const newGroup: TileGroup = {
    id:    newGroupId(),
    tiles,
    position,
    type:  'incomplete',
  }
  return annotateGroups([...groups, newGroup])
}

// ============================================================
// Add tiles to an existing group
// ============================================================

/**
 * Insert `tiles` into `targetGroupId` at `insertIndex`.
 * Returns the updated groups array.
 */
export function addTilesToGroup(
  groups: TileGroup[],
  tiles: Tile[],
  targetGroupId: string,
  insertIndex: number,
): TileGroup[] {
  const updated = groups.map(g => {
    if (g.id !== targetGroupId) return g
    const clamped = Math.max(0, Math.min(insertIndex, g.tiles.length))
    return {
      ...g,
      tiles: [
        ...g.tiles.slice(0, clamped),
        ...tiles,
        ...g.tiles.slice(clamped),
      ],
    }
  })
  return annotateGroups(updated)
}

// ============================================================
// Rearrangement validation
// ============================================================

/**
 * Validates that a proposed rearrangement is legal:
 * 1. All tiles from the original table are still present (conservation)
 * 2. All tiles added from the rack are present
 * 3. Every group is a valid run or set with ≥ 3 tiles
 */
export function validateRearrangement(
  beforeGroups: TileGroup[],
  afterGroups: TileGroup[],
  addedTiles: Tile[],
  removedWildIds: Set<string> = new Set(),
): RearrangementResult {
  // Collect expected tile IDs — exclude wilds that were legally swapped off the table
  const expectedIds = new Set<string>([
    ...beforeGroups.flatMap(g => g.tiles.filter(t => !removedWildIds.has(t.id)).map(t => t.id)),
    ...addedTiles.map(t => t.id),
  ])

  // Collect actual tile IDs
  const actualIds = new Set<string>(
    afterGroups.flatMap(g => g.tiles.map(t => t.id))
  )

  const missingIds = [...expectedIds].filter(id => !actualIds.has(id))
  const extraIds   = [...actualIds].filter(id => !expectedIds.has(id))

  const allTiles = [
    ...beforeGroups.flatMap(g => g.tiles),
    ...addedTiles,
  ]
  const tileById = new Map(allTiles.map(t => [t.id, t]))

  const missingTiles = missingIds.map(id => tileById.get(id)!).filter(Boolean)

  // Check every group is valid (≥ 3 tiles and valid run or set)
  const invalidGroups = afterGroups.filter(g =>
    g.tiles.length < 3 || !isValidGroup(g.tiles).valid
  )

  const violations: string[] = []
  if (missingIds.length > 0) {
    violations.push(`${missingIds.length} tile(s) are missing from the table`)
  }
  if (extraIds.length > 0) {
    violations.push(`${extraIds.length} tile(s) appeared that shouldn't be on the table`)
  }
  if (invalidGroups.length > 0) {
    violations.push(`${invalidGroups.length} group(s) are not valid runs or sets`)
  }

  return {
    valid:         violations.length === 0,
    violations,
    missingTiles,
    invalidGroups,
  }
}

// ============================================================
// Wild color inference
// ============================================================

/**
 * Infers the color a wild tile should be assigned based on its neighbors in a run
 * or the slot's color for a set.
 */
export function inferWildColor(
  wildId: string,
  group: TileGroup,
): import('./types').TileColor | null {
  const { tiles } = group
  const wildIdx = tiles.findIndex(t => t.id === wildId)
  if (wildIdx === -1) return null

  const nonWilds = tiles.filter(t => !t.isWild)
  if (nonWilds.length === 0) return null

  // For a set: all non-wilds share a slot — the wild fills a missing color
  const slots = new Set(nonWilds.map(t => t.slot))
  if (slots.size === 1) {
    // It's a set — determine which color is missing
    const usedColors = new Set(nonWilds.map(t => t.color))
    const allColors: import('./types').TileColor[] = ['red', 'blue', 'green', 'yellow']
    return allColors.find(c => !usedColors.has(c)) ?? null
  }

  // For a run: the wild fills a gap — look at neighbors
  const left  = wildIdx > 0 ? tiles[wildIdx - 1] : null
  const right = wildIdx < tiles.length - 1 ? tiles[wildIdx + 1] : null
  const neighbor = left ?? right
  if (neighbor && !neighbor.isWild) return neighbor.color ?? null

  return nonWilds[0].color ?? null
}

/**
 * Returns true if `rackTile` can legally replace the wild `wildId` in `group`.
 * For runs: rackTile must match the run's color and the slot the wild fills.
 * For sets: rackTile must match the set's slot and supply a missing color.
 */
export function canReplaceWild(
  rackTile: Tile,
  wildId: string,
  group: TileGroup,
): boolean {
  if (rackTile.isWild) return false
  const nonWilds = group.tiles.filter(t => !t.isWild)
  if (nonWilds.length === 0) return false

  const isSet = new Set(nonWilds.map(t => t.slot)).size === 1

  if (isSet) {
    const setSlot    = nonWilds[0].slot
    const usedColors = new Set(nonWilds.map(t => t.color))
    return rackTile.slot === setSlot && !usedColors.has(rackTile.color)
  }

  // Run: determine which slot the wild is filling
  const sortedNonWilds = nonWilds.slice().sort((a, b) => a.slot - b.slot)
  const minSlot   = sortedNonWilds[0].slot
  const maxSlot   = sortedNonWilds[sortedNonWilds.length - 1].slot
  const usedSlots = new Set(sortedNonWilds.map(t => t.slot))
  const gaps: number[] = []
  for (let s = minSlot; s <= maxSlot; s++) {
    if (!usedSlots.has(s)) gaps.push(s)
  }
  const wilds = group.tiles.filter(t => t.isWild)
  const thisWildIndex = wilds.findIndex(t => t.id === wildId)
  if (thisWildIndex === -1) return false
  const requiredSlot = gaps[thisWildIndex] !== undefined
    ? gaps[thisWildIndex]
    : maxSlot + (thisWildIndex - gaps.length + 1)

  const runColor = sortedNonWilds[0].color
  return rackTile.slot === requiredSlot && rackTile.color === runColor
}

/**
 * Replaces a wild tile in a group with `replacementTile`.
 * The group is re-annotated (type updated) after the swap.
 */
export function swapWildInGroup(
  groups: TileGroup[],
  groupId: string,
  wildId: string,
  replacementTile: Tile,
): TileGroup[] {
  return annotateGroups(groups.map(g => {
    if (g.id !== groupId) return g
    return { ...g, tiles: g.tiles.map(t => t.id === wildId ? replacementTile : t) }
  }))
}
