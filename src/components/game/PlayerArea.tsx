import { motion, AnimatePresence } from 'framer-motion'
import type { GamePhase, Tile as TileData } from '@/engine/types'
import TileRack from './TileRack'
import Button from '@/components/ui/Button'
import UnoButton from '@/components/ui/UnoButton'

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
  selectedIds,
  onToggleSelect,
}: PlayerAreaProps) {
  const isMyTurn = phase === 'PLAYER_TURN'

  return (
    <div className={`
      flex flex-col gap-1.5 px-3 py-2 rounded-xl
      ${isMyTurn ? 'bg-white/10 ring-2 ring-white/20' : 'bg-black/20'}
      transition-all duration-300
    `}>
      {/* Header */}
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

        {/* Turn indicator */}
        <AnimatePresence>
          {isMyTurn && (
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
      </div>

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
            className="flex items-center gap-2 justify-center flex-wrap"
          >
            <Button
              variant="primary"
              size="sm"
              onClick={onCommit}
              disabled={!canCommit}
              data-testid="end-turn-btn"
            >
              ✓ End Turn
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={onDraw}
              disabled={tilesPlayedCount > 0}
              data-testid="draw-tile-btn"
            >
              Draw Tile
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={tilesPlayedCount === 0}
              data-testid="cancel-btn"
            >
              ↩ Cancel
            </Button>

            <UnoButton
              visible={tiles.length <= 2 || hasUnoCallPending}
              onClick={onCallUno}
            />
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
            className="text-center text-red-400 text-xs font-bold animate-pulse"
          >
            ⚠️ Call UNO or you'll draw 2 penalty tiles!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
