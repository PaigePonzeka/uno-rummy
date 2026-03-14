import { describe, it, expect } from 'vitest'
import { generateDeck, dealInitialHands, shuffleDeck } from '../deckGenerator'

describe('generateDeck', () => {
  it('produces exactly 100 tiles', () => {
    const deck = generateDeck()
    expect(deck).toHaveLength(100)
  })

  it('has 72 number tiles (9 slots × 4 colors × 2 copies)', () => {
    const deck = generateDeck()
    const numbers = deck.filter(t => t.type === 'number')
    expect(numbers).toHaveLength(72)
  })

  it('has 24 special tiles (3 types × 4 colors × 2 copies)', () => {
    const deck = generateDeck()
    const specials = deck.filter(t => t.type === 'draw2' || t.type === 'skip' || t.type === 'reverse')
    expect(specials).toHaveLength(24)
  })

  it('has exactly 4 wild tiles', () => {
    const deck = generateDeck()
    const wilds = deck.filter(t => t.type === 'wildDrawFour')
    expect(wilds).toHaveLength(4)
  })

  it('has all unique IDs', () => {
    const deck = generateDeck()
    const ids = deck.map(t => t.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(100)
  })

  it('has 2 copies of each color+slot number tile', () => {
    const deck = generateDeck()
    const colors = ['red', 'blue', 'green', 'yellow']
    const numberSlots = [1, 3, 4, 6, 8, 9, 10, 11, 12]
    for (const color of colors) {
      for (const slot of numberSlots) {
        const matches = deck.filter(t => t.color === color && t.slot === slot && t.type === 'number')
        expect(matches).toHaveLength(2)
      }
    }
  })

  it('has no tiles with slots 2, 5, 7 as number type', () => {
    const deck = generateDeck()
    const wrongSlots = deck.filter(t => t.type === 'number' && [2, 5, 7].includes(t.slot))
    expect(wrongSlots).toHaveLength(0)
  })

  it('draw2 tiles have slot 2', () => {
    const deck = generateDeck()
    const draw2 = deck.filter(t => t.type === 'draw2')
    expect(draw2.every(t => t.slot === 2)).toBe(true)
  })

  it('wild tiles have no color', () => {
    const deck = generateDeck()
    const wilds = deck.filter(t => t.type === 'wildDrawFour')
    expect(wilds.every(t => t.color === null)).toBe(true)
  })
})

describe('dealInitialHands', () => {
  it('deals 14 tiles per player', () => {
    const deck = shuffleDeck(generateDeck())
    const { hands } = dealInitialHands(deck, 3)
    hands.forEach(hand => expect(hand).toHaveLength(14))
  })

  it('returns empty tableStarters (board starts clear)', () => {
    const deck = shuffleDeck(generateDeck())
    const { tableStarters } = dealInitialHands(deck, 3)
    expect(tableStarters).toHaveLength(0)
  })

  it('leaves correct number of tiles in draw pile (3 players)', () => {
    const deck = shuffleDeck(generateDeck())
    const { drawPile } = dealInitialHands(deck, 3)
    // 100 - (14 × 3) = 58
    expect(drawPile).toHaveLength(58)
  })

  it('leaves correct number of tiles in draw pile (4 players)', () => {
    const deck = shuffleDeck(generateDeck())
    const { drawPile } = dealInitialHands(deck, 4)
    // 100 - (14 × 4) = 44
    expect(drawPile).toHaveLength(44)
  })

  it('total tiles remain 100', () => {
    const deck = shuffleDeck(generateDeck())
    const { hands, tableStarters, drawPile } = dealInitialHands(deck, 3)
    const total = hands.flat().length + tableStarters.flatMap(g => g.tiles).length + drawPile.length
    expect(total).toBe(100)
  })
})
