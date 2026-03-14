import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import Button from '@/components/ui/Button'
import { CreatureCard, CREATURES } from '@/components/ui/Avatar'
import type { ZooCreatureKey } from '@/engine/types'

const ALL_CREATURES = Object.values(CREATURES)

export default function GameSetupScreen() {
  const { players, initializeGame, startRound } = useGameStore()
  const humanName = players[0]?.name ?? 'You'

  const [cpuCount, setCpuCount] = useState<1 | 2 | 3>(1)
  const [selected, setSelected] = useState<ZooCreatureKey[]>(['leo'])

  function toggleCreature(key: ZooCreatureKey) {
    setSelected(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key)
      }
      if (prev.length < cpuCount) {
        return [...prev, key]
      }
      // Replace last selection
      return [...prev.slice(0, -1), key]
    })
  }

  function handleCpuCount(n: 1 | 2 | 3) {
    setCpuCount(n)
    setSelected(prev => prev.slice(0, n))
  }

  function handleStart() {
    if (selected.length !== cpuCount) return

    initializeGame({
      cpuCount,
      selectedCreatures: selected,
      humanPlayerName:   humanName,
    })
    startRound()
  }

  const ready = selected.length === cpuCount

  return (
    <div className="min-h-screen felt-table flex flex-col items-center justify-start py-10 px-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white mb-1">Choose Your Opponents</h2>
          <p className="text-white/60">Hey {humanName}! Pick your challengers.</p>
        </div>

        {/* CPU Count selector */}
        <div className="mb-6">
          <p className="text-white/70 text-sm font-bold mb-3 text-center">Number of Opponents</p>
          <div className="flex gap-3 justify-center">
            {([1, 2, 3] as const).map(n => (
              <button
                key={n}
                onClick={() => handleCpuCount(n)}
                className={`
                  w-14 h-14 rounded-xl font-black text-xl transition-all duration-200
                  ${cpuCount === n
                    ? 'bg-uno-red text-white scale-110 shadow-lg'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'}
                `}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Creature grid */}
        <div className="mb-6">
          <p className="text-white/70 text-sm font-bold mb-3 text-center">
            Select {cpuCount} opponent{cpuCount > 1 ? 's' : ''} ({selected.length}/{cpuCount} selected)
          </p>
          <div className="grid grid-cols-4 gap-3">
            {ALL_CREATURES.map(meta => (
              <CreatureCard
                key={meta.key}
                meta={meta}
                selected={selected.includes(meta.key)}
                onClick={() => toggleCreature(meta.key)}
              />
            ))}
          </div>
        </div>

        {/* Start button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleStart}
            disabled={!ready}
            className="px-12"
            data-testid="distribute-btn"
          >
            {ready ? '🀄 Distribute Tiles!' : `Select ${cpuCount - selected.length} more`}
          </Button>

        </div>

        {/* Back */}
        <div className="text-center mt-4">
          <button
            onClick={() => useGameStore.getState()._setPhase('WELCOME')}
            className="text-white/40 text-sm hover:text-white/70 transition-colors"
          >
            ← Back
          </button>
        </div>
      </motion.div>
    </div>
  )
}
