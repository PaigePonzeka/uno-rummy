import type { Tile, TileGroup, ValidationResult, PlayOption } from './types'
import { newGroupId, findFreePosition } from './deckGenerator'

// ============================================================
// Run validation
// ============================================================


// Re-implement with cleaner logic to avoid edge case bugs:
export function isValidRunClean(tiles: Tile[]): boolean {
  if (tiles.length < 3 || tiles.length > 12) return false

  const wilds = tiles.filter(t => t.isWild)
  const nonWilds = tiles.filter(t => !t.isWild)

  if (nonWilds.length === 0) return true // all wilds

  // All non-wilds must share the same color
  const color = nonWilds[0].color
  if (nonWilds.some(t => t.color !== color)) return false

  // No duplicate slots in a run
  const slots = nonWilds.map(t => t.slot).sort((a, b) => a - b)
  for (let i = 1; i < slots.length; i++) {
    if (slots[i] === slots[i - 1]) return false
  }

  const minSlot = slots[0]
  const maxSlot = slots[slots.length - 1]

  if (minSlot < 1 || maxSlot > 12) return false

  // The run spans from some start to some end
  // Non-wild slots must fit within a consecutive window of size = tiles.length
  // We need to find a consecutive window of length tiles.length that:
  //   1. Contains all non-wild slots
  //   2. The remaining (tiles.length - nonWilds.length) positions are wildcards

  const windowSize = tiles.length
  const wildcardCount = wilds.length

  const neededSpan = maxSlot - minSlot + 1

  if (neededSpan > windowSize) return false
  if (windowSize - nonWilds.length > wildcardCount) return false
  if (windowSize > 12) return false

  return true
}

// ============================================================
// Set validation
// ============================================================

/**
 * A set is 3–4 tiles of the same slot number, one per color.
 * Wild Draw Four can substitute for any missing color.
 */
export function isValidSet(tiles: Tile[]): boolean {
  if (tiles.length < 3 || tiles.length > 4) return false

  const wilds = tiles.filter(t => t.isWild)
  const nonWilds = tiles.filter(t => !t.isWild)

  if (nonWilds.length === 0) return true // all wilds

  // All non-wilds must have the same slot number
  const targetSlot = nonWilds[0].slot
  if (nonWilds.some(t => t.slot !== targetSlot)) return false

  // All non-wilds must have different colors
  const colors = nonWilds.map(t => t.color)
  const uniqueColors = new Set(colors)
  if (uniqueColors.size !== nonWilds.length) return false

  // Wilds can substitute for the remaining colors
  // nonWilds.length + wilds.length must equal tiles.length (always true)
  // We just need enough wilds to fill the remaining slots
  const remainingColors = 4 - nonWilds.length // max possible additional
  return wilds.length <= remainingColors
}

// ============================================================
// Group validation (dispatches to run or set)
// ============================================================

export function isValidGroup(tiles: Tile[]): ValidationResult {
  if (tiles.length < 3) {
    return { valid: false, type: null, reason: 'Group needs at least 3 tiles' }
  }

  if (isValidRunClean(tiles)) {
    return { valid: true, type: 'run' }
  }

  if (isValidSet(tiles)) {
    return { valid: true, type: 'set' }
  }

  // Give a more helpful error
  const wilds = tiles.filter(t => t.isWild)
  const nonWilds = tiles.filter(t => !t.isWild)
  const colors = new Set(nonWilds.map(t => t.color))
  const slots = new Set(nonWilds.map(t => t.slot))

  if (slots.size === 1 && colors.size === nonWilds.length) {
    return { valid: false, type: null, reason: `Set too large (max 4 tiles, one per color)` }
  }
  if (colors.size === 1) {
    return { valid: false, type: null, reason: `Run has gaps that ${wilds.length} wild(s) cannot fill` }
  }

  return { valid: false, type: null, reason: 'Not a valid run (same color, consecutive) or set (same number, different colors)' }
}

// ============================================================
// Table state validation (used at commit time)
// ============================================================

/**
 * Returns true if every group on the table is a valid run or set with ≥ 3 tiles.
 */
export function isValidTableState(groups: TileGroup[]): boolean {
  return groups.every(g => {
    if (g.tiles.length < 3) return false
    return isValidGroup(g.tiles).valid
  })
}

/**
 * Returns groups that are currently invalid (for highlighting).
 */
export function getInvalidGroups(groups: TileGroup[]): TileGroup[] {
  return groups.filter(g => !isValidGroup(g.tiles).valid || g.tiles.length < 3)
}

/**
 * Annotates each group with its current type.
 */
export function annotateGroups(groups: TileGroup[]): TileGroup[] {
  return groups.map(g => {
    if (g.tiles.length < 3) {
      return { ...g, type: 'incomplete' as const }
    }
    const result = isValidGroup(g.tiles)
    if (result.valid && result.type === 'run' && g.tiles.every(t => !t.isWild)) {
      return {
        ...g,
        tiles: [...g.tiles].sort((a, b) => a.slot - b.slot),
        type: 'run' as const,
      }
    }
    return {
      ...g,
      type: result.valid ? result.type! : 'invalid' as const,
    }
  })
}

// ============================================================
// Play option finder (used by AI and human hint system)
// ============================================================

/**
 * Finds all tiles in `rack` that can be added to any existing group.
 * Also finds combinations of rack tiles that can form a new group.
 *
 * Returns an array of PlayOptions sorted by number of tiles played (desc).
 */
export function findValidPlays(rack: Tile[], tableGroups: TileGroup[]): PlayOption[] {
  const options: PlayOption[] = []

  // Option A: Add single tiles to existing groups
  for (const tile of rack) {
    for (const group of tableGroups) {
      // Try appending to end (checked first so append wins over prepend for deduplication)
      const appendTest = [...group.tiles, tile]
      if (isValidGroup(appendTest).valid) {
        const newGroup: TileGroup = { ...group, tiles: appendTest }
        options.push({
          tilesToPlay: [tile],
          targetGroup: group,
          insertPosition: group.tiles.length,
          newTableState: tableGroups.map(g => g.id === group.id ? newGroup : g),
        })
      }
      // Try prepending to start
      const prependTest = [tile, ...group.tiles]
      if (isValidGroup(prependTest).valid) {
        const newGroup: TileGroup = { ...group, tiles: prependTest }
        options.push({
          tilesToPlay: [tile],
          targetGroup: group,
          insertPosition: 0,
          newTableState: tableGroups.map(g => g.id === group.id ? newGroup : g),
        })
      }
      // Try inserting in the middle (for runs)
      for (let i = 1; i < group.tiles.length; i++) {
        const insertTest = [...group.tiles.slice(0, i), tile, ...group.tiles.slice(i)]
        if (isValidGroup(insertTest).valid) {
          const newGroup: TileGroup = { ...group, tiles: insertTest }
          options.push({
            tilesToPlay: [tile],
            targetGroup: group,
            insertPosition: i,
            newTableState: tableGroups.map(g => g.id === group.id ? newGroup : g),
          })
          break // one insert per group per tile is enough
        }
      }
    }
  }

  // Option B: Form new groups from rack tiles (min 3)
  const rackCombos = getCombinations(rack, 3, 4)
  for (const combo of rackCombos) {
    if (isValidGroup(combo).valid) {
      const newGroup: TileGroup = {
        id:       newGroupId(),
        tiles:    combo,
        position: findFreePosition(tableGroups),
        type:     'incomplete',
      }
      options.push({
        tilesToPlay: combo,
        targetGroup: null,
        newTableState: [...tableGroups, newGroup],
      })
    }
  }

  // Deduplicate and sort by tiles played (descending)
  return options
    .filter((opt, i, arr) =>
      arr.findIndex(o =>
        o.tilesToPlay.map(t => t.id).sort().join() ===
        opt.tilesToPlay.map(t => t.id).sort().join()
      ) === i
    )
    .sort((a, b) => b.tilesToPlay.length - a.tilesToPlay.length)
}

/** Get all combinations of size k to maxK from arr */
function getCombinations<T>(arr: T[], minK: number, maxK: number): T[][] {
  const result: T[][] = []
  for (let k = minK; k <= Math.min(maxK, arr.length); k++) {
    combineHelper(arr, k, 0, [], result)
  }
  return result
}

function combineHelper<T>(arr: T[], k: number, start: number, current: T[], result: T[][]): void {
  if (current.length === k) {
    result.push([...current])
    return
  }
  for (let i = start; i < arr.length; i++) {
    current.push(arr[i])
    combineHelper(arr, k, i + 1, current, result)
    current.pop()
  }
}
