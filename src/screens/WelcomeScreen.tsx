import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useSettingsStore } from '@/store/settingsStore'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import DarkModeToggle from '@/components/ui/DarkModeToggle'

export default function WelcomeScreen() {
  const [name, setName] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)

  const initializeGame = useGameStore(s => s.initializeGame)
  const scoreHistory   = useSettingsStore(s => s.scoreHistory)
  const clearHistory   = useSettingsStore(s => s.clearHistory)

  function handleStart() {
    const trimmed = name.trim()
    if (!trimmed) return
    initializeGame({
      cpuCount:          1,
      selectedCreatures: ['leo'],
      humanPlayerName:   trimmed,
    })
    // Navigate to SETUP phase (handled in App.tsx)
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center felt-table relative overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center mb-10"
      >
        <div className="text-7xl mb-4">🦁</div>
        <h1 className="text-5xl font-black text-white tracking-tight mb-2">
          UNO RUMMY UP
        </h1>
        <p className="text-white/60 text-lg">
          The tile game where the rules are just suggestions
        </p>
      </motion.div>

      {/* Name input */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-6 w-full max-w-sm px-6"
      >
        <div className="w-full">
          <label className="text-white/70 text-sm font-bold mb-2 block">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            data-testid="name-input"
            placeholder="Enter your name..."
            maxLength={20}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20
                       text-white placeholder-white/30 font-semibold
                       focus:outline-none focus:ring-2 focus:ring-white/40
                       focus:border-white/40 transition-all"
          />
        </div>

        <Button
          onClick={handleStart}
          disabled={!name.trim()}
          fullWidth
          size="lg"
          data-testid="start-btn"
        >
          Choose Opponents →
        </Button>

        <button
          onClick={() => setHistoryOpen(true)}
          className="text-white/40 text-sm hover:text-white/70 transition-colors"
        >
          View Score History ({scoreHistory.length})
        </button>
      </motion.div>

      {/* Animals decoration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-6 text-4xl flex gap-3 opacity-30"
      >
        <span>🦓</span>
        <span>🦒</span>
        <span>🦛</span>
        <span>🦜</span>
        <span>🐧</span>
        <span>🐒</span>
        <span>🦁</span>
        <span>🐯</span>
      </motion.div>

      {/* Score History Modal */}
      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Score History"
        maxWidth="max-w-md"
      >
        {scoreHistory.length === 0 ? (
          <p className="text-white/50 text-center py-4">No games played yet!</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {scoreHistory.map((entry, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between text-sm text-white/70 mb-1">
                  <span>{entry.date}</span>
                  <span className="font-bold text-white">Winner: {entry.winnerName}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearHistory}>
            Clear History
          </Button>
        </div>
      </Modal>
    </div>
  )
}
