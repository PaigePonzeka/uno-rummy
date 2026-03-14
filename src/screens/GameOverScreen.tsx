import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useSettingsStore } from '@/store/settingsStore'
import Button from '@/components/ui/Button'
import { CREATURES } from '@/components/ui/Avatar'
import type { ZooCreatureKey } from '@/engine/types'

export default function GameOverScreen() {
  const { players, scoreHistory, initializeGame, startRound, _setPhase } = useGameStore()
  const { addScoreEntry } = useSettingsStore()

  const winner = [...players].sort((a, b) => b.score - a.score)[0]
  const isHumanWinner = winner.type === 'human'

  // Save score to history
  useEffect(() => {
    if (scoreHistory.length === 0) return
    addScoreEntry({
      date:            new Date().toLocaleDateString(),
      humanPlayerName: players[0]?.name ?? 'Player',
      rounds:          scoreHistory,
      winnerId:        winner.id,
      winnerName:      winner.name,
    })
  }, [])

  function playAgain() {
    const config = {
      cpuCount:          (players.length - 1) as 1 | 2 | 3,
      selectedCreatures: players.slice(1).map(p => p.creatureKey!),
      humanPlayerName:   players[0]?.name ?? 'Player',
    }
    initializeGame(config)
    startRound()
  }

  return (
    <div className="h-screen w-screen felt-table flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-gray-900/95 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl"
      >
        {/* Winner announcement */}
        <div className="text-6xl mb-4">
          {isHumanWinner ? '🏆' : getWinnerEmoji(winner.creatureKey as ZooCreatureKey)}
        </div>
        <h1 className="text-3xl font-black text-white mb-2">
          {isHumanWinner ? 'You Won!' : `${winner.name} Wins!`}
        </h1>
        <p className="text-white/60 mb-6">
          {isHumanWinner
            ? `Congratulations! You reached ${winner.score} points!`
            : `${winner.name} crushed it with ${winner.score} points.`}
        </p>

        {/* Final scores */}
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Final Scores</h3>
          <div className="space-y-2">
            {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-xs w-4">#{i + 1}</span>
                  <span className="text-lg">
                    {p.type === 'cpu' ? getWinnerEmoji(p.creatureKey as ZooCreatureKey) : '👤'}
                  </span>
                  <span className="text-white text-sm font-semibold">{p.name}</span>
                </div>
                <span className={`font-black tabular-nums ${i === 0 ? 'text-yellow-400' : 'text-white/70'}`}>
                  {p.score} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button fullWidth size="lg" onClick={playAgain}>
            Play Again
          </Button>
          <Button variant="ghost" fullWidth onClick={() => _setPhase('WELCOME')}>
            Main Menu
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

function getWinnerEmoji(key: ZooCreatureKey | undefined): string {
  if (!key) return '🤖'
  return CREATURES[key]?.emoji ?? '🤖'
}
