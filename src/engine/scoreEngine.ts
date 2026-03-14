import type { Tile, Player, RoundScore } from './types'

// ============================================================
// Tile scoring
// ============================================================

/** Returns the scoring value for a single tile. */
export function tileScoringValue(tile: Tile): number {
  return tile.scoreValue
}

/** Sum of all tile values in a rack. */
export function calculateRackValue(rack: Tile[]): number {
  return rack.reduce((sum, t) => sum + tileScoringValue(t), 0)
}

// ============================================================
// Round end processing
// ============================================================

export interface RoundResult {
  winnerId: string
  winnerName: string
  /** Points scored this round per player (winner gets opponents' totals) */
  pointsEarned: { playerId: string; playerName: string; points: number }[]
  /** Updated player objects with new cumulative scores */
  updatedPlayers: Player[]
  roundScore: RoundScore
}

/**
 * Process end-of-round scoring.
 *
 * @param players         Current player list
 * @param winnerIndex     Index of the player who went out
 * @param roundNumber     Current round number
 */
export function processRoundEnd(
  players: Player[],
  winnerIndex: number,
  roundNumber: number,
): RoundResult {
  const winner = players[winnerIndex]

  // Calculate total from all losing racks
  let winnerPoints = 0
  const pointsEarned: RoundResult['pointsEarned'] = []

  for (const player of players) {
    const rackValue = calculateRackValue(player.rack)
    if (player.id === winner.id) {
      // Winner scores the sum of all opponents' racks
      // (counted below)
    } else {
      winnerPoints += rackValue
    }

    pointsEarned.push({
      playerId:   player.id,
      playerName: player.name,
      points:     player.id === winner.id ? 0 : rackValue,
    })
  }

  const roundScore: RoundScore = {
    roundNumber,
    winnerId: winner.id,
    scores: pointsEarned,
  }

  const updatedPlayers = players.map((p, i) => ({
    ...p,
    score: i === winnerIndex ? p.score + winnerPoints : p.score,
    rack:  p.rack, // racks stay as-is for display until next round
  }))

  return {
    winnerId:       winner.id,
    winnerName:     winner.name,
    pointsEarned,
    updatedPlayers,
    roundScore,
  }
}

// ============================================================
// Game win detection
// ============================================================

const WINNING_SCORE = 200

/**
 * Returns the winning player if any player has reached the winning score,
 * or null if the game continues.
 */
export function checkGameWin(players: Player[]): Player | null {
  // Return the player with the highest score if they've hit the threshold
  const candidates = players
    .filter(p => p.score >= WINNING_SCORE)
    .sort((a, b) => b.score - a.score)

  return candidates[0] ?? null
}

/** Returns the player with the highest current score (for mid-game "leader" checks). */
export function getLeader(players: Player[]): Player {
  return [...players].sort((a, b) => b.score - a.score)[0]
}

/** Returns the player with the fewest rack tiles (most likely to go out next). */
export function getClosestToWinning(players: Player[]): Player {
  return [...players].sort((a, b) => a.rack.length - b.rack.length)[0]
}
