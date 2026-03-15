import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Plus, Lightbulb, RotateCcw, Skull, ChevronDown, ChevronUp } from 'lucide-react'
import type { GamePhase, Tile as TileData } from '@/engine/types'
import TileRack from './TileRack'
import Button from '@/components/ui/Button'
import UnoButton from '@/components/ui/UnoButton'
import SoundToggle from '@/components/ui/SoundToggle'

interface PlayerAreaProps {
  playerName: string
  tiles: TileData[]
  rackOrder: string[]
  phase: GamePhase
  tilesPlayedCount: number
  hasUnoCallPending: boolean
  canCommit: boolean
  onCommit: () => void
  onDraw: () => void
  onCallUno: () => void
  onCancel: () => void
  onGiveUp: () => void
  onHint?: () => void
  selectedIds: Set<string>
  onToggleSelect: (id: string, multi: boolean) => void
}

export default function PlayerArea({
  playerName,
  tiles,
  rackOrder,
  phase,
  tilesPlayedCount,
  hasUnoCallPending,
  canCommit,
  onCommit,
  onDraw,
  onCallUno,
  onCancel,
  onGiveUp,
  onHint,
  selectedIds,
  onToggleSelect,
}: PlayerAreaProps) {
  const isMyTurn = phase === 'PLAYER_TURN'
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={`
      flex flex-col gap-1.5 px-3 py-2 rounded-xl
      bg-black/30 backdrop-blur-sm
      ${isMyTurn ? 'ring-2 ring-white/20' : ''}
      transition-all duration-300
    `}>
      {/* Always-visible header strip with collapse toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">👤</span>
          <div>
            <div className="text-white font-bold text-sm">{playerName}</div>
            <div className="text-white/50 text-xs" data-testid="turn-status">
              {isMyTurn ? 'Your turn!' : 'Waiting...'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Turn progress indicator */}
          <AnimatePresence>
            {isMyTurn && !collapsed && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-xs bg-white/20 px-2 py-1 rounded-full text-white/80"
              >
                {tilesPlayedCount > 0 ? `${tilesPlayedCount}/4 played` : 'Play 1–4 tiles or draw'}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title={collapsed ? 'Expand rack' : 'Minimize rack'}
            aria-label={collapsed ? 'Expand rack' : 'Minimize rack'}
          >
            {collapsed
              ? <ChevronUp size={14} className="text-white/70" />
              : <ChevronDown size={14} className="text-white/70" />}
          </button>
        </div>
      </div>

      {/* Collapsible body: rack + buttons */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            {/* Rack */}
            <TileRack
              tiles={tiles}
              orderedIds={rackOrder}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              disabled={!isMyTurn}
            />

            {/* Action buttons */}
            <AnimatePresence>
              {isMyTurn && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center gap-2 justify-center flex-wrap mt-1.5"
                >
                  <Button
                    variant="success"
                    size="sm"
                    onClick={onCommit}
                    disabled={!canCommit}
                    title="End Turn (Space)"
                    data-testid="end-turn-btn"
                  >
                    <span className="flex items-center gap-1.5"><Check size={13} /> End Turn</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onDraw}
                    disabled={tilesPlayedCount > 0}
                    title="Draw Tile (D)"
                    data-testid="draw-tile-btn"
                  >
                    <span className="flex items-center gap-1.5"><Plus size={13} /> Draw Tile</span>
                  </Button>

                  {onHint && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onHint}
                      title="Suggest best play"
                    >
                      <span className="flex items-center gap-1.5"><Lightbulb size={13} /> Hint</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    disabled={tilesPlayedCount === 0}
                    title="Reset Board (Esc)"
                    data-testid="cancel-btn"
                  >
                    <span className="flex items-center gap-1.5"><RotateCcw size={13} /> Reset Board</span>
                  </Button>

                  <UnoButton
                    visible={tiles.length === 1 || hasUnoCallPending}
                    onClick={onCallUno}
                  />

                  <span className="text-white/20 select-none">|</span>

                  <SoundToggle />

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={onGiveUp}
                    data-testid="give-up-btn"
                    style={{ opacity: 0.75 }}
                  >
                    <span className="flex items-center gap-1.5"><Skull size={13} /> Give Up</span>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* UNO penalty warning */}
            <AnimatePresence>
              {hasUnoCallPending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-red-400 text-xs font-bold animate-pulse mt-1"
                >
                  ⚠️ Call UNO or you'll draw 2 penalty tiles!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
