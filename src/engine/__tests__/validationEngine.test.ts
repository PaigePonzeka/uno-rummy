import { describe, it, expect } from 'vitest'
import { isValidRunClean, isValidSet, isValidGroup, isValidTableState, annotateGroups } from '../validationEngine'
import type { Tile, TileGroup } from '../types'

// ============================================================
// Tile helpers
// ============================================================

function num(color: Tile['color'], slot: number): Tile {
  return {
    id:            `${color}_${slot}_test`,
    color:         color as Tile['color'],
    type:          'number',
    slot,
    displayNumber: slot,
    scoreValue:    slot!,
    isWild:        false,
  }
}

function special(color: Tile['color'], type: 'draw2' | 'skip' | 'reverse'): Tile {
  const slotMap = { draw2: 2, skip: 5, reverse: 7 } as const
  return {
    id:            `${color}_${type}_test`,
    color:         color as Tile['color'],
    type,
    slot:          slotMap[type],
    displayNumber: slotMap[type],
    scoreValue:    20,
    isWild:        false,
  }
}

function wild(i = 0): Tile {
  return {
    id:            `wild_${i}`,
    color:         null,
    type:          'wildDrawFour',
    slot:          0,
    displayNumber: null,
    scoreValue:    50,
    isWild:        true,
  }
}

function group(tiles: Tile[]): TileGroup {
  return { id: 'test', tiles, position: { x: 0, y: 0 }, type: 'incomplete' }
}

// ============================================================
// isValidRunClean
// ============================================================

describe('isValidRunClean', () => {
  it('accepts a basic 3-tile run', () => {
    // 3,4,6 has a gap at 5 (Skip) — not valid without a tile there
    expect(isValidRunClean([num('red', 3), num('red', 4), num('red', 6)])).toBe(false)
    // 8,9,10 are consecutive — valid
    expect(isValidRunClean([num('red', 8), num('red', 9), num('red', 10)])).toBe(true)
    // 1,3,4 has a gap at 2 (Draw Two) — not valid without it
    expect(isValidRunClean([num('red', 1), num('red', 3), num('red', 4)])).toBe(false)
  })

  it('accepts red 1,2,3 (Draw2 at slot 2)', () => {
    expect(isValidRunClean([num('red', 1), special('red', 'draw2'), num('red', 3)])).toBe(true)
  })

  it('rejects run with mixed colors', () => {
    expect(isValidRunClean([num('red', 1), num('blue', 3), num('red', 4)])).toBe(false)
  })

  it('rejects run with fewer than 3 tiles', () => {
    expect(isValidRunClean([num('red', 1), num('red', 3)])).toBe(false)
  })

  it('accepts run with wild filling a gap', () => {
    expect(isValidRunClean([num('red', 1), wild(), num('red', 3)])).toBe(true)
  })

  it('accepts run of all wilds', () => {
    expect(isValidRunClean([wild(0), wild(1), wild(2)])).toBe(true)
  })

  it('rejects run with duplicate slots', () => {
    expect(isValidRunClean([num('red', 4), num('red', 4), num('red', 6)])).toBe(false)
  })

  it('accepts run with Skip at slot 5', () => {
    expect(isValidRunClean([num('green', 4), special('green', 'skip'), num('green', 6)])).toBe(true)
  })

  it('rejects run that spans too wide for available wilds', () => {
    // [1, _, _, _, 6] needs 3 wilds but we only have 1
    expect(isValidRunClean([num('red', 1), wild(), num('red', 6)])).toBe(false)
  })
})

// ============================================================
// isValidSet
// ============================================================

describe('isValidSet', () => {
  it('accepts a 3-tile set', () => {
    expect(isValidSet([num('red', 9), num('blue', 9), num('green', 9)])).toBe(true)
  })

  it('accepts a 4-tile set', () => {
    expect(isValidSet([num('red', 9), num('blue', 9), num('green', 9), num('yellow', 9)])).toBe(true)
  })

  it('rejects set with repeated color', () => {
    expect(isValidSet([num('red', 9), num('red', 9), num('green', 9)])).toBe(false)
  })

  it('rejects set with mixed slot numbers', () => {
    expect(isValidSet([num('red', 9), num('blue', 10), num('green', 9)])).toBe(false)
  })

  it('rejects set with only 2 tiles', () => {
    expect(isValidSet([num('red', 9), num('blue', 9)])).toBe(false)
  })

  it('rejects 5-tile set', () => {
    // Can never have 5 because only 4 colors exist
    const extra = { ...num('red', 9), id: 'extra', color: 'blue' as const }
    expect(isValidSet([num('red', 9), num('blue', 9), num('green', 9), num('yellow', 9), extra])).toBe(false)
  })

  it('accepts set with one wild', () => {
    expect(isValidSet([num('red', 9), num('blue', 9), wild()])).toBe(true)
  })

  it('accepts set of all wilds (3)', () => {
    expect(isValidSet([wild(0), wild(1), wild(2)])).toBe(true)
  })

  it('accepts special tiles in a set', () => {
    expect(isValidSet([special('red', 'skip'), special('blue', 'skip'), special('green', 'skip')])).toBe(true)
  })
})

// ============================================================
// isValidGroup
// ============================================================

describe('isValidGroup', () => {
  it('identifies a run', () => {
    const result = isValidGroup([num('blue', 8), num('blue', 9), num('blue', 10)])
    expect(result.valid).toBe(true)
    expect(result.type).toBe('run')
  })

  it('identifies a set', () => {
    const result = isValidGroup([num('red', 4), num('blue', 4), num('green', 4)])
    expect(result.valid).toBe(true)
    expect(result.type).toBe('set')
  })

  it('rejects a group of 2', () => {
    const result = isValidGroup([num('red', 4), num('blue', 4)])
    expect(result.valid).toBe(false)
  })

  it('rejects an invalid combination', () => {
    const result = isValidGroup([num('red', 1), num('blue', 4), num('green', 9)])
    expect(result.valid).toBe(false)
  })
})

// ============================================================
// isValidTableState
// ============================================================

describe('isValidTableState', () => {
  it('returns true for all valid groups', () => {
    const groups: TileGroup[] = [
      group([num('red', 8), num('red', 9), num('red', 10)]),
      group([num('blue', 9), num('green', 9), num('yellow', 9)]),
    ]
    expect(isValidTableState(groups)).toBe(true)
  })

  it('returns false if any group has fewer than 3 tiles', () => {
    const groups: TileGroup[] = [
      group([num('red', 1), num('red', 3), num('red', 4)]),
      group([num('blue', 9), num('green', 9)]),
    ]
    expect(isValidTableState(groups)).toBe(false)
  })

  it('returns false if any group is invalid', () => {
    const groups: TileGroup[] = [
      group([num('red', 1), num('blue', 4), num('green', 9)]),
    ]
    expect(isValidTableState(groups)).toBe(false)
  })
})

// ============================================================
// annotateGroups — run sorting with wilds
// ============================================================

describe('annotateGroups run sorting', () => {
  it('sorts a wild-free run into ascending slot order', () => {
    const g = group([num('red', 11), num('red', 9), num('red', 10)])
    const [annotated] = annotateGroups([g])
    expect(annotated.type).toBe('run')
    expect(annotated.tiles.map(t => t.slot)).toEqual([9, 10, 11])
  })

  it('sorts a run with a wild so the wild fills the gap position', () => {
    // [9, Wild, 11] + 8 appended → should sort to [8, 9, Wild(gap@10), 11]
    const g = group([num('red', 9), wild(0), num('red', 11), num('red', 8)])
    const [annotated] = annotateGroups([g])
    expect(annotated.type).toBe('run')
    const slots = annotated.tiles.map(t => t.slot)
    // Non-wilds in order: 8, 9, 11; gap at 10 → wild goes between 9 and 11
    expect(slots[0]).toBe(8)
    expect(slots[1]).toBe(9)
    expect(annotated.tiles[2].isWild).toBe(true)
    expect(slots[3]).toBe(11)
  })

  it('places wild at the start when it extends the run below minimum', () => {
    // Wild + 9, 10, 11 where wild covers slot 8
    const g = group([num('red', 9), num('red', 10), num('red', 11), wild(0)])
    const [annotated] = annotateGroups([g])
    expect(annotated.type).toBe('run')
    // No internal gap → wild extends beyond maxSlot (goes last)
    expect(annotated.tiles[3].isWild).toBe(true)
  })
})
