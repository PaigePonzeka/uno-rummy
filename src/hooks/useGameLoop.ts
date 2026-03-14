import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { ZooCreatureKey } from '@/engine/types'
import { getAI } from '@/ai/baseAI'

/**
 * Drives CPU turns. When `phase === 'CPU_THINKING'` and the current player is a CPU,
 * this hook calls the appropriate AI, waits for its decision, then applies it.
 */
export function useCpuTurns() {
  const phase              = useGameStore(s => s.phase)
  const currentPlayerIndex = useGameStore(s => s.currentPlayerIndex)
  const players            = useGameStore(s => s.players)
  const tableGroups        = useGameStore(s => s.tableGroups)

  const { setCpuAnimating, applyCpuTurn } = useGameStore()

  const runningRef = useRef(false)

  useEffect(() => {
    if (phase !== 'CPU_THINKING') {
      runningRef.current = false
      return
    }

    const player = players[currentPlayerIndex]
    if (!player || player.type !== 'cpu' || !player.creatureKey) return
    if (runningRef.current) return
    runningRef.current = true

    const ai = getAI(player.creatureKey as ZooCreatureKey)

    // Run AI turn asynchronously
    ai.decideTurn(
      player.rack,
      tableGroups,
      useGameStore.getState(),
      currentPlayerIndex,
    ).then(turn => {
      setCpuAnimating()

      // Small delay for animation
      setTimeout(() => {
        applyCpuTurn(
          currentPlayerIndex,
          turn.tilesToPlay?.map(t => t.id) ?? [],
          turn.newTableState ?? null,
          turn.callUno ?? false,
        )
        runningRef.current = false
      }, 400)
    })
  }, [phase, currentPlayerIndex])
}
