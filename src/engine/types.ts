// ============================================================
// Core tile types
// ============================================================

export type TileColor = 'red' | 'blue' | 'green' | 'yellow'

export type TileType = 'number' | 'draw2' | 'skip' | 'reverse' | 'wildDrawFour'

/**
 * A single game tile.
 *
 * Slot numbers 1–12 map to:
 *   1→1, 2→Draw2, 3→3, 4→4, 5→Skip, 6→6, 7→Reverse, 8–12→8–12
 */
export interface Tile {
  /** Stable unique ID: "{color}_{slot}_{a|b}" or "wild_{0-3}" */
  id: string
  /** null for Wild Draw Four */
  color: TileColor | null
  type: TileType
  /** Slot number used for run ordering (1–12). Wild = 0 (no slot). */
  slot: number
  /** The number printed on the tile face (same as slot for number tiles) */
  displayNumber: number | null
  /** Scoring value: face value for numbers, 20 for specials, 50 for wild */
  scoreValue: number
  isWild: boolean
  /** Set when a wild is placed in a group to indicate which color it fills */
  wildAssignedColor?: TileColor
}

// ============================================================
// Table group types
// ============================================================

export type TileGroupType = 'run' | 'set' | 'incomplete' | 'invalid'

export interface TileGroup {
  /** Stable unique ID generated per group instance */
  id: string
  tiles: Tile[]
  /** Position on the free-form canvas */
  position: { x: number; y: number }
  /** Updated by validation engine after every change */
  type: TileGroupType
}

// ============================================================
// Player types
// ============================================================

export type ZooCreatureKey =
  | 'ziggy'    // Zebra — Easy
  | 'gerald'   // Giraffe — Easy
  | 'harriet'  // Hippo — Medium
  | 'polly'    // Parrot — Medium
  | 'penelope' // Penguin — Medium
  | 'marco'    // Monkey — Medium-Hard
  | 'leo'      // Lion — Hard
  | 'tara'     // Tiger — Hard

export interface Player {
  id: string
  name: string
  type: 'human' | 'cpu'
  rack: Tile[]
  score: number
  creatureKey?: ZooCreatureKey
  hasCalledUno: boolean
  unoCallPending: boolean
}

// ============================================================
// Game phase state machine
// ============================================================

export type GamePhase =
  | 'WELCOME'
  | 'SETUP'
  | 'DEALING'
  | 'PLAYER_TURN'
  | 'CPU_THINKING'
  | 'CPU_ANIMATING'
  | 'VALIDATING'
  | 'ROUND_END'
  | 'GAME_OVER'

// ============================================================
// Effect / action types
// ============================================================

export type PendingEffectType = 'draw2' | 'skip' | 'wildDrawFour' | 'reverse'

export interface PendingEffect {
  type: PendingEffectType
  targetPlayerIndex: number
  drawCount: number
}

export type GameActionType =
  | 'PLAY_TILES'
  | 'DRAW_TILE'
  | 'REARRANGE'
  | 'CALL_UNO'
  | 'END_TURN'
  | 'CPU_TURN'

export interface GameAction {
  type: GameActionType
  playerId: string
  tiles?: Tile[]
  newTableState?: TileGroup[]
}

// ============================================================
// Scoring
// ============================================================

export interface RoundScore {
  roundNumber: number
  winnerId: string
  scores: { playerId: string; playerName: string; points: number }[]
}

export interface ScoreHistoryEntry {
  date: string
  humanPlayerName: string
  rounds: RoundScore[]
  winnerId: string
  winnerName: string
}

// ============================================================
// Game state
// ============================================================

export interface TurnSnapshot {
  tableGroups: TileGroup[]
  playerRack: Tile[]
}

export interface LastFiredEffect {
  type: PendingEffectType
  actorName: string
  targetName: string
}

export interface GameState {
  phase: GamePhase
  players: Player[]
  currentPlayerIndex: number
  drawPile: Tile[]
  tableGroups: TileGroup[]
  turnSnapshot: TurnSnapshot | null
  tilesPlayedThisTurn: Tile[]
  swappedWildsThisTurn: Tile[]
  turnDirection: 1 | -1
  pendingEffect: PendingEffect | null
  lastFiredEffect: LastFiredEffect | null
  unoPenaltyFiredAt: number
  roundNumber: number
  scoreHistory: RoundScore[]
  lastAction: GameAction | null
  canvasSize: { w: number; h: number }
}

// ============================================================
// Config types
// ============================================================

export interface GameConfig {
  cpuCount: 1 | 2 | 3
  selectedCreatures: ZooCreatureKey[]
  humanPlayerName: string
}

// ============================================================
// Validation / manipulation engine types
// ============================================================

export interface ValidationResult {
  valid: boolean
  type: 'run' | 'set' | null
  reason?: string
}

export interface PlayOption {
  tilesToPlay: Tile[]
  targetGroup: TileGroup | null
  insertPosition?: number
  newTableState: TileGroup[]
}

export interface RearrangementResult {
  valid: boolean
  violations: string[]
  missingTiles: Tile[]
  invalidGroups: TileGroup[]
}

// ============================================================
// AI types
// ============================================================

export interface AIPersonality {
  /** 0–1: chance of missing a valid play (takes Easy→Hard) */
  mistakeProbability: number
  /** 0–1: chance of attempting to rearrange table on a turn */
  rearrangeProbability: number
  /** 0–1: tendency to draw even when plays exist */
  drawPreference: number
  /** 0–1: eagerness to target opponents with special tiles */
  specialAggressiveness: number
  /** [min, max] ms to "think" (for realistic pacing) */
  thinkingTimeMs: [number, number]
  /** max tiles played per turn */
  combosPerTurn: number
}

export interface AITurn {
  action: 'play' | 'draw'
  tilesToPlay?: Tile[]
  newTableState?: TileGroup[]
  callUno?: boolean
  /** Wilds received from the board via swap (added to rack, not counted as "played"). */
  wildsReceived?: Tile[]
}
