import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  GameState,
  GameConfig,
  GamePhase,
  Tile,
  TileGroup,
  Player,
  PendingEffect,
  LastFiredEffect,
  ZooCreatureKey,
} from '@/engine/types'
import { generateDeck, shuffleDeck, dealInitialHands, snapGroupsToCenter } from '@/engine/deckGenerator'
import {
  validateRearrangement,
  cloneGroups,
  cloneTiles,
  addTilesToGroup,
  createGroupFromTiles,
  splitGroup,
} from '@/engine/manipulationEngine'
import { annotateGroups, isValidTableState } from '@/engine/validationEngine'
import { processRoundEnd, checkGameWin } from '@/engine/scoreEngine'

// ============================================================
// Action result
// ============================================================

export interface ActionResult {
  success: boolean
  message?: string
}

// ============================================================
// Store interface
// ============================================================

interface GameStore extends GameState {
  // ── Setup ───────────────────────────────────────────────
  initializeGame:    (config: GameConfig) => void
  startRound:        () => void

  // ── Human turn actions ──────────────────────────────────
  /**
   * Move tiles from the human player's rack to the table.
   * If targetGroupId is provided, inserts at insertPosition.
   * Otherwise creates a new group at `position`.
   */
  playTilesFromRack: (
    tileIds: string[],
    targetGroupId: string | null,
    insertPosition: number,
    position: { x: number; y: number },
  ) => ActionResult

  /** Live update of table (called during drag — no commit validation). */
  rearrangeTable:    (newGroups: TileGroup[]) => void

  /** Validate and advance the turn. */
  commitTurn:        () => ActionResult

  /** Draw one tile from the pile (auto-commits). */
  drawTile:          () => void

  /** Call UNO. */
  callUno:           () => void

  /** Restore from turn snapshot. */
  cancelTurn:        () => void

  /** Return a tile from the table back to the human rack (only tiles played this turn). */
  returnTileToRack:  (tileId: string, fromGroupId: string) => ActionResult

  // ── CPU actions ─────────────────────────────────────────
  /** Apply the result of a CPU AI turn. */
  applyCpuTurn: (
    playerIndex: number,
    tileIds: string[],
    newTableState: TileGroup[] | null,
    calledUno: boolean,
  ) => void

  splitTableGroup: (groupId: string, splitIndex: number) => void

  setCpuThinking: (playerIndex: number) => void
  setCpuAnimating: () => void

  // ── Internal ─────────────────────────────────────────────
  _startTurnSnapshot: () => void
  _advanceTurn:       () => void
  _applyPendingEffect: () => void
  _setPhase:          (phase: GamePhase) => void
  _endRound:          (winnerIndex: number) => void

  /** Update the measured canvas dimensions (called by ResizeObserver in TableCanvas). */
  setCanvasSize: (w: number, h: number) => void

  /** Clear saved session and return to welcome screen. */
  resetGame: () => void
}

// ============================================================
// Initial state
// ============================================================

const initialState: GameState = {
  phase:               'WELCOME',
  players:             [],
  currentPlayerIndex:  0,
  drawPile:            [],
  tableGroups:         [],
  turnSnapshot:        null,
  tilesPlayedThisTurn: [],
  turnDirection:       1,
  pendingEffect:       null,
  lastFiredEffect:     null,
  roundNumber:         0,
  scoreHistory:        [],
  lastAction:          null,
  canvasSize:          { w: 920, h: 450 },
}

// ============================================================
// Helpers
// ============================================================

function makePlayers(config: GameConfig): Player[] {
  const human: Player = {
    id:              'human',
    name:            config.humanPlayerName,
    type:            'human',
    rack:            [],
    score:           0,
    hasCalledUno:    false,
    unoCallPending:  false,
  }

  const cpus: Player[] = config.selectedCreatures.map((key, i) => ({
    id:              `cpu_${i}`,
    name:            CPU_NAMES[key],
    type:            'cpu',
    rack:            [],
    score:           0,
    creatureKey:     key,
    hasCalledUno:    false,
    unoCallPending:  false,
  }))

  // Human always at index 0
  return [human, ...cpus]
}

export const CPU_NAMES: Record<ZooCreatureKey, string> = {
  ziggy:    'Ziggy',
  gerald:   'Gerald',
  harriet:  'Harriet',
  polly:    'Polly',
  penelope: 'Penelope',
  marco:    'Marco',
  leo:      'Leo',
  tara:     'Tara',
}

function nextPlayerIndex(
  current: number,
  playerCount: number,
  direction: 1 | -1,
): number {
  return ((current + direction) % playerCount + playerCount) % playerCount
}

function resolveSpecialEffect(tiles: Tile[]): PendingEffect | null {
  const specials = tiles.filter(t =>
    t.type === 'draw2' || t.type === 'skip' || t.type === 'reverse' || t.type === 'wildDrawFour'
  )
  if (specials.length === 0) return null

  // Priority: wildDrawFour > draw2 > skip > reverse
  const priority = ['wildDrawFour', 'draw2', 'skip', 'reverse'] as const
  for (const p of priority) {
    const found = specials.find(t => t.type === p)
    if (found) {
      if (found.type === 'wildDrawFour') return { type: 'wildDrawFour', targetPlayerIndex: -1, drawCount: 4 }
      if (found.type === 'draw2')        return { type: 'draw2',        targetPlayerIndex: -1, drawCount: 2 }
      if (found.type === 'skip')         return { type: 'skip',         targetPlayerIndex: -1, drawCount: 0 }
      if (found.type === 'reverse')      return { type: 'reverse',      targetPlayerIndex: -1, drawCount: 0 }
    }
  }
  return null
}

// ============================================================
// Store
// ============================================================

export const useGameStore = create<GameStore>()(persist((set, get) => ({
  ...initialState,

  // ── Phase helper ────────────────────────────────────────

  _setPhase: (phase) => set({ phase }),

  // ── Setup ───────────────────────────────────────────────

  initializeGame: (config) => {
    const players = makePlayers(config)
    set({
      ...initialState,
      phase:   'SETUP',
      players,
    })
  },

  startRound: () => {
    const { players, roundNumber } = get()
    const deck = shuffleDeck(generateDeck())
    const dealt = dealInitialHands(deck, players.length)

    const updatedPlayersWithRack = players.map((p, i) => ({
      ...p,
      rack:           cloneTiles(dealt.hands[i]),
      hasCalledUno:   false,
      unoCallPending: false,
    }))

    set({
      phase:               'PLAYER_TURN',
      players:             updatedPlayersWithRack,
      drawPile:            dealt.drawPile,
      tableGroups:         annotateGroups(dealt.tableStarters),
      turnSnapshot:        null,
      tilesPlayedThisTurn: [],
      currentPlayerIndex:  0,
      turnDirection:       1,
      pendingEffect:        null,
      roundNumber:         roundNumber + 1,
      lastAction:          null,
    })

    get()._startTurnSnapshot()
  },

  // ── Turn snapshot ────────────────────────────────────────

  _startTurnSnapshot: () => {
    const { tableGroups, players, currentPlayerIndex } = get()
    set({
      turnSnapshot: {
        tableGroups: cloneGroups(tableGroups),
        playerRack:  cloneTiles(players[currentPlayerIndex].rack),
      },
      tilesPlayedThisTurn: [],
    })
  },

  cancelTurn: () => {
    const { turnSnapshot, players, currentPlayerIndex } = get()
    if (!turnSnapshot) return

    const updatedPlayersWithRack = players.map((p, i) =>
      i === currentPlayerIndex
        ? { ...p, rack: cloneTiles(turnSnapshot.playerRack) }
        : p
    )

    set({
      tableGroups:         cloneGroups(turnSnapshot.tableGroups),
      players:             updatedPlayersWithRack,
      tilesPlayedThisTurn: [],
    })
  },

  // ── Human play tiles ─────────────────────────────────────

  playTilesFromRack: (tileIds, targetGroupId, insertPosition, position) => {
    const { players, currentPlayerIndex, tableGroups, tilesPlayedThisTurn } = get()
    const player = players[currentPlayerIndex]

    if (player.type !== 'human') {
      return { success: false, message: 'Not your turn' }
    }
    if (tileIds.length === 0) {
      return { success: false, message: 'No tiles selected' }
    }
    if (tilesPlayedThisTurn.length + tileIds.length > 4) {
      return { success: false, message: 'You can only play up to 4 tiles per turn' }
    }

    // Pull tiles from rack
    const playedTiles: Tile[] = []
    let newRack = [...player.rack]
    for (const id of tileIds) {
      const idx = newRack.findIndex(t => t.id === id)
      if (idx === -1) return { success: false, message: `Tile ${id} not in rack` }
      playedTiles.push(newRack[idx])
      newRack.splice(idx, 1)
    }

    // Update table
    let newGroups: TileGroup[]
    if (targetGroupId) {
      newGroups = addTilesToGroup(tableGroups, playedTiles, targetGroupId, insertPosition)
    } else {
      newGroups = createGroupFromTiles(tableGroups, playedTiles, position)
    }

    const updatedPlayersWithRack = players.map((p, i) =>
      i === currentPlayerIndex ? { ...p, rack: newRack } : p
    )

    set({
      tableGroups:         newGroups,
      players:             updatedPlayersWithRack,
      tilesPlayedThisTurn: [...tilesPlayedThisTurn, ...playedTiles],
    })

    return { success: true }
  },

  rearrangeTable: (newGroups) => {
    set({ tableGroups: annotateGroups(newGroups) })
  },

  returnTileToRack: (tileId, fromGroupId) => {
    const { players, currentPlayerIndex, tableGroups, tilesPlayedThisTurn } = get()
    const player = players[currentPlayerIndex]

    if (player.type !== 'human') {
      return { success: false, message: 'Not your turn' }
    }
    if (!tilesPlayedThisTurn.some(t => t.id === tileId)) {
      return { success: false, message: 'You can only return tiles you played this turn' }
    }

    const sourceGroup = tableGroups.find(g => g.id === fromGroupId)
    if (!sourceGroup) return { success: false, message: 'Group not found' }

    const tile = sourceGroup.tiles.find(t => t.id === tileId)
    if (!tile) return { success: false, message: 'Tile not found in group' }

    const newGroups = annotateGroups(
      tableGroups
        .map(g => g.id === fromGroupId ? { ...g, tiles: g.tiles.filter(t => t.id !== tileId) } : g)
        .filter(g => g.tiles.length > 0)
    )

    const updatedPlayersWithRack = players.map((p, i) =>
      i === currentPlayerIndex ? { ...p, rack: [...p.rack, tile] } : p
    )

    set({
      tableGroups:         newGroups,
      players:             updatedPlayersWithRack,
      tilesPlayedThisTurn: tilesPlayedThisTurn.filter(t => t.id !== tileId),
    })

    return { success: true }
  },

  // ── Commit turn ──────────────────────────────────────────

  commitTurn: () => {
    const {
      tableGroups,
      turnSnapshot,
      tilesPlayedThisTurn,
      players,
      currentPlayerIndex,
    } = get()

    if (!turnSnapshot) return { success: false, message: 'No active turn' }
    if (tilesPlayedThisTurn.length === 0) {
      return { success: false, message: 'You must play at least one tile or draw' }
    }

    const validation = validateRearrangement(
      turnSnapshot.tableGroups,
      tableGroups,
      tilesPlayedThisTurn,
    )

    if (!validation.valid) {
      return {
        success: false,
        message: validation.violations.join('. '),
      }
    }

    // Determine special effect from played tiles
    const effect = resolveSpecialEffect(tilesPlayedThisTurn)

    // Check if player emptied their rack
    const player = players[currentPlayerIndex]
    if (player.rack.length === 0) {
      get()._endRound(currentPlayerIndex)
      return { success: true }
    }

    // UNO check: if rack now has 1 tile and player hasn't called UNO
    const updatedPlayersWithRack = players.map((p, i) => {
      if (i !== currentPlayerIndex) return p
      const unoCallPending = p.rack.length === 1 && !p.hasCalledUno
      return { ...p, unoCallPending }
    })

    const resolvedEffect = effect
      ? resolveEffectTarget(effect, currentPlayerIndex, updatedPlayersWithRack.length, get().turnDirection)
      : null

    const actorName  = players[currentPlayerIndex].name
    const targetName = resolvedEffect ? updatedPlayersWithRack[resolvedEffect.targetPlayerIndex]?.name ?? '' : ''

    const newLastFiredEffect: LastFiredEffect | null = resolvedEffect
      ? { type: resolvedEffect.type, actorName, targetName }
      : null

    const { canvasSize } = get()
    const snappedGroups = snapGroupsToCenter(tableGroups, canvasSize.w, canvasSize.h)

    set({
      tableGroups:     snappedGroups,
      players:         updatedPlayersWithRack,
      turnSnapshot:    null,
      pendingEffect:   resolvedEffect,
      lastFiredEffect: newLastFiredEffect,
    })

    get()._advanceTurn()
    return { success: true }
  },

  // ── Draw tile ────────────────────────────────────────────

  drawTile: () => {
    // Cancel any in-progress board changes before drawing
    get().cancelTurn()

    const { drawPile, players, currentPlayerIndex } = get()
    const tile = drawPile[0]
    if (!tile) return

    const updatedPlayersWithRack = players.map((p, i) =>
      i === currentPlayerIndex
        ? { ...p, rack: [...p.rack, tile], unoCallPending: false }
        : p
    )

    set({
      drawPile:     drawPile.slice(1),
      players:      updatedPlayersWithRack,
      turnSnapshot: null,
    })

    get()._advanceTurn()
  },

  // ── UNO ──────────────────────────────────────────────────

  callUno: () => {
    const { players, currentPlayerIndex } = get()
    set({
      players: players.map((p, i) =>
        i === currentPlayerIndex
          ? { ...p, hasCalledUno: true, unoCallPending: false }
          : p
      ),
    })
  },

  // ── Split run group ──────────────────────────────────────

  splitTableGroup: (groupId, splitIndex) => {
    const { tableGroups } = get()
    const source = tableGroups.find(g => g.id === groupId)
    if (!source) return
    const TILE_W = 54
    const newPos = {
      x: source.position.x + splitIndex * TILE_W + 12,
      y: source.position.y + 96,
    }
    set({ tableGroups: splitGroup(tableGroups, groupId, splitIndex, newPos) })
  },

  // ── CPU helpers ──────────────────────────────────────────

  setCpuThinking: (playerIndex) => {
    set({ phase: 'CPU_THINKING', currentPlayerIndex: playerIndex })
    get()._startTurnSnapshot()
  },

  setCpuAnimating: () => set({ phase: 'CPU_ANIMATING' }),

  applyCpuTurn: (playerIndex, tileIds, newTableState, calledUno) => {
    const { players, drawPile, tableGroups, tilesPlayedThisTurn } = get()
    const player = players[playerIndex]

    if (tileIds.length === 0) {
      // Draw a tile
      const tile = drawPile[0]
      if (tile) {
        const updatedPlayersWithRack = players.map((p, i) =>
          i === playerIndex ? { ...p, rack: [...p.rack, tile] } : p
        )
        set({
          drawPile:     drawPile.slice(1),
          players:      updatedPlayersWithRack,
          turnSnapshot: null,
          phase:        'CPU_ANIMATING',
        })
      }
      get()._advanceTurn()
      return
    }

    // Remove tiles from CPU rack
    const playedTiles: Tile[] = []
    let newRack = [...player.rack]
    for (const id of tileIds) {
      const idx = newRack.findIndex(t => t.id === id)
      if (idx !== -1) {
        playedTiles.push(newRack[idx])
        newRack.splice(idx, 1)
      }
    }

    let finalGroups = newTableState
      ? annotateGroups(newTableState)
      : annotateGroups(tableGroups)

    // Validate AI output — if invalid, revert table and have CPU draw instead
    if (newTableState && !isValidTableState(finalGroups)) {
      console.warn('[AI] CPU produced invalid table state — reverting; CPU draws instead')
      finalGroups = annotateGroups(tableGroups)
      newRack = [...player.rack]  // put tiles back
      const drawn = drawPile[0]
      if (drawn) newRack = [...newRack, drawn]
    }

    // Recompute updatedPlayersWithRack in case newRack was reverted above
    const updatedPlayersWithRack = players.map((p, i) => {
      if (i !== playerIndex) return p
      const unoCallPending = newRack.length === 1 && !calledUno
      return { ...p, rack: newRack, hasCalledUno: calledUno, unoCallPending }
    })

    const playedTilesForEffect = updatedPlayersWithRack[playerIndex].rack.length < player.rack.length
      ? playedTiles
      : []  // tiles were reverted, no special effect

    const effect = resolveSpecialEffect(playedTilesForEffect)

    if (newRack.length === 0) {
      set({
        players:     updatedPlayersWithRack,
        tableGroups: finalGroups,
        turnSnapshot: null,
        phase:       'CPU_ANIMATING',
      })
      get()._endRound(playerIndex)
      return
    }

    const cpuResolvedEffect = effect
      ? resolveEffectTarget(effect, playerIndex, updatedPlayersWithRack.length, get().turnDirection)
      : null

    const cpuActorName  = players[playerIndex].name
    const cpuTargetName = cpuResolvedEffect ? updatedPlayersWithRack[cpuResolvedEffect.targetPlayerIndex]?.name ?? '' : ''

    set({
      players:             updatedPlayersWithRack,
      tableGroups:         finalGroups,
      tilesPlayedThisTurn: [...tilesPlayedThisTurn, ...playedTiles],
      turnSnapshot:        null,
      pendingEffect:       cpuResolvedEffect,
      lastFiredEffect:     cpuResolvedEffect
        ? { type: cpuResolvedEffect.type, actorName: cpuActorName, targetName: cpuTargetName }
        : null,
      phase:               'CPU_ANIMATING',
    })

    get()._advanceTurn()
  },

  // ── Advance turn ─────────────────────────────────────────

  _advanceTurn: () => {
    const { players, currentPlayerIndex, turnDirection, pendingEffect } = get()

    // Apply UNO penalty for any player who still has unoCallPending
    const penaltyPlayers = applyUnoPenalties(players, get().drawPile)

    let nextIndex = nextPlayerIndex(currentPlayerIndex, players.length, turnDirection)

    // Handle reverse (2-player: act as skip)
    let newDirection = turnDirection
    if (pendingEffect?.type === 'reverse') {
      if (players.length === 2) {
        // skip the next player (acts same as skip)
        nextIndex = currentPlayerIndex
      } else {
        newDirection = (turnDirection * -1) as 1 | -1
        nextIndex = nextPlayerIndex(currentPlayerIndex, players.length, newDirection)
      }
    }

    // Handle skip/draw2/wildDrawFour — targeted player draws (handled in _applyPendingEffect)
    // but also loses their turn; advance past them
    if (
      pendingEffect?.type === 'skip' ||
      pendingEffect?.type === 'draw2' ||
      pendingEffect?.type === 'wildDrawFour'
    ) {
      nextIndex = nextPlayerIndex(nextIndex, players.length, newDirection)
    }

    set({
      players:       penaltyPlayers.players,
      drawPile:      penaltyPlayers.drawPile,
      turnDirection: newDirection,
    })

    if (pendingEffect) {
      get()._applyPendingEffect()
    }

    const nextPlayer = get().players[nextIndex]
    set({
      currentPlayerIndex:  nextIndex,
      tilesPlayedThisTurn: [],
    })

    if (nextPlayer.type === 'human') {
      set({ phase: 'PLAYER_TURN' })
      get()._startTurnSnapshot()
    } else {
      set({ phase: 'CPU_THINKING' })
      get()._startTurnSnapshot()
    }
  },

  _applyPendingEffect: () => {
    const { pendingEffect, players, drawPile } = get()
    if (!pendingEffect || pendingEffect.targetPlayerIndex === -1) {
      set({ pendingEffect: null })
      return
    }

    const target = pendingEffect.targetPlayerIndex
    if (pendingEffect.drawCount > 0) {
      const drawnTiles = drawPile.slice(0, pendingEffect.drawCount)
      const updatedPlayersWithRack = players.map((p, i) =>
        i === target ? { ...p, rack: [...p.rack, ...drawnTiles] } : p
      )
      set({
        players:   updatedPlayersWithRack,
        drawPile:  drawPile.slice(pendingEffect.drawCount),
        pendingEffect: null,
      })
    } else {
      set({ pendingEffect: null })
    }
  },

  // ── Round end ────────────────────────────────────────────

  _endRound: (winnerIndex: number) => {
    const { players, roundNumber, scoreHistory } = get()
    const result = processRoundEnd(players, winnerIndex, roundNumber)

    set({
      phase:        'ROUND_END',
      players:      result.updatedPlayers,
      scoreHistory: [...scoreHistory, result.roundScore],
    })

    const gameWinner = checkGameWin(result.updatedPlayers)
    if (gameWinner) {
      set({ phase: 'GAME_OVER' })
    }
  },

  setCanvasSize: (w, h) => set({ canvasSize: { w, h } }),

  resetGame: () => {
    set({ ...initialState })
    // clearStorage is available after the store is initialised
    setTimeout(() => useGameStore.persist.clearStorage(), 0)
  },
} as GameStore),
{
  name: 'uno-rummy-session',
  partialize: (state: GameStore) => ({
    phase:               state.phase,
    players:             state.players,
    currentPlayerIndex:  state.currentPlayerIndex,
    drawPile:            state.drawPile,
    tableGroups:         state.tableGroups,
    tilesPlayedThisTurn: state.tilesPlayedThisTurn,
    turnDirection:       state.turnDirection,
    pendingEffect:       state.pendingEffect,
    roundNumber:         state.roundNumber,
    scoreHistory:        state.scoreHistory,
    lastAction:          state.lastAction,
    // turnSnapshot and lastFiredEffect are transient — not persisted
  }),
  onRehydrateStorage: () => (state: GameStore | undefined) => {
    if (!state) return
    // Snap CPU-in-progress phases to a safe player-turn state on reload
    if (
      state.phase === 'CPU_THINKING' ||
      state.phase === 'CPU_ANIMATING' ||
      state.phase === 'DEALING'
    ) {
      state.phase = 'PLAYER_TURN'
    }
    state.turnSnapshot    = null
    state.lastFiredEffect = null
    state.pendingEffect   = null
  },
}))

// ============================================================
// Helpers (module-level, not in store)
// ============================================================

function resolveEffectTarget(
  effect: Omit<PendingEffect, 'targetPlayerIndex'>,
  currentIndex: number,
  playerCount: number,
  direction: 1 | -1,
): PendingEffect {
  const target = nextPlayerIndex(currentIndex, playerCount, direction)
  return { ...effect, targetPlayerIndex: target }
}

function applyUnoPenalties(
  players: Player[],
  drawPile: Tile[],
): { players: Player[]; drawPile: Tile[] } {
  let pile = [...drawPile]
  const updated = players.map(p => {
    if (!p.unoCallPending) return p
    const penalty = pile.slice(0, 2)
    pile = pile.slice(2)
    return { ...p, rack: [...p.rack, ...penalty], unoCallPending: false }
  })
  return { players: updated, drawPile: pile }
}
