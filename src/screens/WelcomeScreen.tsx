import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useSettingsStore } from '@/store/settingsStore'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import DarkModeToggle from '@/components/ui/DarkModeToggle'

// 4-colour tile logo — matches brand palette
function TileLogo() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2"  y="2"  width="30" height="30" rx="7" fill="#D72600" />
      <rect x="40" y="2"  width="30" height="30" rx="7" fill="#0956BF" />
      <rect x="2"  y="40" width="30" height="30" rx="7" fill="#ECD407" />
      <rect x="40" y="40" width="30" height="30" rx="7" fill="#379711" />
      <rect x="28" y="2"  width="16" height="68" rx="4" fill="rgba(0,0,0,0.55)" />
      <rect x="2"  y="28" width="68" height="16" rx="4" fill="rgba(0,0,0,0.55)" />
      <circle cx="36" cy="36" r="7" fill="#FFF8E7" />
    </svg>
  )
}

export default function WelcomeScreen() {
  const [name, setName] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [instructionsOpen, setInstructionsOpen] = useState(false)

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
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center felt-table relative overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>

      {/* Hero */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center mb-8"
      >
        <motion.div
          className="flex justify-center mb-5"
          animate={{ rotate: [0, -4, 4, -2, 0] }}
          transition={{ delay: 0.8, duration: 0.6, ease: 'easeInOut' }}
        >
          <TileLogo />
        </motion.div>

        <h1 className="text-5xl font-black text-white tracking-tight mb-3">
          Uno Rummy Up
        </h1>

        <p className="text-white/70 text-base font-medium mb-1">
          The classic tile game — play against the zoo, win bragging rights.
        </p>
        <p className="text-white/40 text-sm">
          Build runs, stack sets, and empty your rack before they do.
        </p>
      </motion.div>

      {/* Name input + CTA */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex flex-col items-center gap-5 w-full max-w-sm px-6"
      >
        <div className="w-full">
          <label className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2 block">
            What should we call you?
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            data-testid="name-input"
            placeholder="Enter your name…"
            maxLength={20}
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20
                       text-white placeholder-white/30 font-semibold text-base
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
          Let's Play →
        </Button>

        <div className="flex gap-4">
          <button
            onClick={() => setInstructionsOpen(true)}
            className="text-white/35 text-sm hover:text-white/65 transition-colors"
          >
            How to Play
          </button>
          <span className="text-white/20 select-none">·</span>
          <button
            onClick={() => setHistoryOpen(true)}
            className="text-white/35 text-sm hover:text-white/65 transition-colors"
          >
            Score History ({scoreHistory.length} {scoreHistory.length === 1 ? 'game' : 'games'})
          </button>
        </div>
      </motion.div>

      {/* Zoo parade */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="absolute bottom-5 flex gap-3 text-3xl"
        style={{ opacity: 0.22 }}
      >
        {['🦓','🦒','🦛','🦜','🐧','🐒','🐯'].map((emoji, i) => (
          <motion.span
            key={emoji}
            animate={{ y: [0, -4, 0] }}
            transition={{ delay: i * 0.12 + 0.6, duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            {emoji}
          </motion.span>
        ))}
      </motion.div>

      {/* Instructions Modal */}
      <Modal
        open={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
        title="How to Play"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-sm text-white/80">
          <section>
            <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-2 text-white/50">The Deck</h3>
            <p>100 tiles: numbers 1–12 in 4 colors (red, blue, green, yellow) × 2 copies each, plus 4 Wild tiles. Tiles 2, 5, and 7 are special — <span className="text-white/60">Draw 2</span>, <span className="text-white/60">Skip</span>, and <span className="text-white/60">Reverse</span>.</p>
          </section>

          <section>
            <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-2 text-white/50">Your Turn</h3>
            <ul className="space-y-1">
              <li>▸ <strong className="text-white">Play 1–4 tiles</strong> from your rack onto the board</li>
              <li>▸ <strong className="text-white">Rearrange</strong> any tiles already on the board</li>
              <li>▸ <strong className="text-white">Draw 1 tile</strong> if you can't or don't want to play — ends your turn automatically</li>
              <li>▸ The final board must contain only <strong className="text-white">valid groups</strong> to end your turn</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-2 text-white/50">Valid Groups (3+ tiles)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-white font-semibold mb-1">Run</div>
                <div className="text-white/60">3+ consecutive numbers, same color</div>
                <div className="text-white/40 text-xs mt-1">e.g. Red 4 · 6 · 8 · 9</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-white font-semibold mb-1">Set</div>
                <div className="text-white/60">3–4 same number, different colors</div>
                <div className="text-white/40 text-xs mt-1">e.g. Blue 9 · Red 9 · Green 9</div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-2 text-white/50">Wild Tile</h3>
            <p>Acts as any tile in a group. You can <strong className="text-white">swap a Wild</strong> off the board by replacing it with the exact tile it represents — the Wild comes to your rack.</p>
          </section>

          <section>
            <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-2 text-white/50">Special Tiles</h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white/5 rounded p-2 text-center"><div className="text-lg mb-1">+2</div><div className="text-white/60">Draw 2</div></div>
              <div className="bg-white/5 rounded p-2 text-center"><div className="text-lg mb-1">⊘</div><div className="text-white/60">Skip</div></div>
              <div className="bg-white/5 rounded p-2 text-center"><div className="text-lg mb-1">↺</div><div className="text-white/60">Reverse</div></div>
            </div>
            <p className="mt-2 text-white/50 text-xs">Effects only trigger when played from your rack. If multiple specials are played, only the strongest takes effect.</p>
          </section>

          <section>
            <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-2 text-white/50">Scoring &amp; Winning</h3>
            <ul className="space-y-1">
              <li>▸ Empty your rack to win the round</li>
              <li>▸ Score = sum of all opponents' remaining tiles (numbers at face value, specials = 20, wild = 50)</li>
              <li>▸ First player to <strong className="text-white">200 points</strong> wins the game</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-2 text-white/50">UNO Rule</h3>
            <p>When you're down to <strong className="text-white">1 tile</strong>, press <strong className="text-white">UNO!</strong> before ending your turn — or draw 2 penalty tiles.</p>
          </section>
        </div>
      </Modal>

      {/* Score History Modal */}
      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Score History"
        maxWidth="max-w-md"
      >
        {scoreHistory.length === 0 ? (
          <p className="text-white/50 text-center py-4">No games played yet — go make history!</p>
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
