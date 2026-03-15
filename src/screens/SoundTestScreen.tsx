import { Home, Volume2 } from 'lucide-react'
import { useSound, type SoundKey } from '@/hooks/useSound'
import Button from '@/components/ui/Button'
import SoundToggle from '@/components/ui/SoundToggle'

// ── Sound Registry ────────────────────────────────────────────
// Add, remove, or reorder entries here to update the test page.
// Each entry describes one sound in the game.

type SoundCategory = 'tile' | 'special' | 'game' | 'feedback'

interface SoundEntry {
  key: SoundKey
  label: string
  description: string
  category: SoundCategory
}

const SOUND_REGISTRY: SoundEntry[] = [
  // Tile interactions
  { key: 'tileClick',   label: 'Tile Click',     description: 'Selecting a tile from your rack',              category: 'tile' },
  { key: 'tilePlay',    label: 'Tile Play',      description: 'Auto-placing a valid set onto the board',      category: 'tile' },
  { key: 'tileDraw',    label: 'Tile Draw',      description: 'Drawing a tile from the draw pile',            category: 'tile' },

  // Special card effects
  { key: 'skip',        label: 'Skip',           description: 'A player is skipped by a Skip tile',           category: 'special' },
  { key: 'drawPenalty', label: 'Draw Penalty',   description: 'Forced draw from a Draw 2 or Wild +4',         category: 'special' },
  { key: 'specialPlay', label: 'Reverse',        description: 'Reverse tile played — turn order flips',       category: 'special' },
  { key: 'wildPlay',    label: 'Wild Play',      description: 'Wild Draw Four placed on the board',           category: 'special' },

  // Game events
  { key: 'unoCall',     label: 'UNO! Call',      description: 'Pressing the UNO button — last tile warning',  category: 'game' },
  { key: 'roundWin',    label: 'Round Win',      description: 'You won the round',                            category: 'game' },
  { key: 'roundLose',   label: 'Round Lose',     description: 'You lost the round',                           category: 'game' },
  { key: 'giveUp',      label: 'Give Up',        description: 'Player resigned (womp womp)',                  category: 'game' },

  // Feedback / penalties
  { key: 'unoPenalty',  label: 'UNO Penalty',    description: 'Forgot to call UNO — draw 2 penalty tiles',    category: 'feedback' },
  { key: 'error',       label: 'Error',          description: 'Invalid move — commit was rejected',           category: 'feedback' },
]

const CATEGORY_LABELS: Record<SoundCategory, string> = {
  tile:     'Tile Interactions',
  special:  'Special Card Effects',
  game:     'Game Events',
  feedback: 'Feedback & Penalties',
}

const CATEGORY_ORDER: SoundCategory[] = ['tile', 'special', 'game', 'feedback']

// ── Screen ────────────────────────────────────────────────────

export default function SoundTestScreen() {
  const { play } = useSound()

  function goHome() {
    window.location.hash = ''
  }

  const byCategory = CATEGORY_ORDER.map(cat => ({
    category: cat,
    entries: SOUND_REGISTRY.filter(e => e.category === cat),
  }))

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Volume2 size={24} /> Sound Test
            </h1>
            <p className="text-white/50 text-sm mt-1">Click any button to preview the sound</p>
          </div>
          <div className="flex items-center gap-3">
            <SoundToggle />
            <Button variant="ghost" size="sm" onClick={goHome}>
              <span className="flex items-center gap-1.5"><Home size={14} /> Back to Game</span>
            </Button>
          </div>
        </div>

        {/* Sound sections */}
        <div className="space-y-8">
          {byCategory.map(({ category, entries }) => (
            <section key={category}>
              <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">
                {CATEGORY_LABELS[category]}
              </h2>
              <div className="space-y-2">
                {entries.map(entry => (
                  <button
                    key={entry.key}
                    onClick={() => play(entry.key)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors border border-white/10 hover:border-white/20 group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm group-hover:text-white text-white/80">
                          {entry.label}
                        </div>
                        <div className="text-xs text-white/40 mt-0.5">
                          {entry.description}
                        </div>
                      </div>
                      <Volume2 size={14} className="text-white/20 group-hover:text-white/60 flex-shrink-0 ml-4" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-10 pt-6 border-t border-white/10 text-center">
          <p className="text-white/30 text-xs mb-3">Dev tools</p>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { window.location.hash = '#/dev/tiles' }}>
              Tile Gallery →
            </Button>
            <Button variant="ghost" size="sm" onClick={goHome}>
              <span className="flex items-center gap-1.5"><Home size={14} /> Game</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
