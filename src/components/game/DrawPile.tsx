import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { TileBack } from './Tile'

interface DrawPileProps {
  count: number
  onDraw?: () => void
  disabled?: boolean
}

export default function DrawPile({ count, onDraw, disabled }: DrawPileProps) {
  const { setNodeRef } = useDroppable({ id: 'draw-pile' })

  return (
    <div className="flex flex-col items-center gap-1" ref={setNodeRef}>
      <motion.button
        onClick={disabled ? undefined : onDraw}
        whileHover={disabled ? {} : { scale: 1.05 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        disabled={disabled}
        className={`relative ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        title={disabled ? undefined : 'Draw a tile'}
        aria-label={`Draw pile — ${count} tiles remaining`}
      >
        <TileBack />
      </motion.button>
      <span className="text-white/60 text-xs font-mono">{count}</span>
    </div>
  )
}
